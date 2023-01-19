#!/usr/bin/env python
# coding: utf-8

from __future__ import annotations
# from typing import Annotated
from typing import Callable, OrderedDict, Tuple, Type
import random
import numpy as np
import pandas as pd
import torch
from sklearn.model_selection import train_test_split
from torch.utils.data.dataloader import DataLoader
from torch.utils.data.dataset import TensorDataset
from raptgen.core.algorithms import VAE, profile_hmm_vae_loss
from tqdm.auto import tqdm

# seed 値の固定は https://qiita.com/north_redwing/items/1e153139125d37829d2d を参照した。
# 英文では https://pytorch.org/docs/stable/notes/randomness.html が相当する。

_seed_exists: bool = False
"""random seed が存在するかどうかを示すフラグ。`True` 時に存在を保証する。 """

_seed: int = 42
"""実際のシード値。デフォルトでは `42`。"""

def set_seed(seed: int):
    """シード値を設定する。この関数本体では DataLoader 周り以外のシード値を設定しているが，この関数が呼ばれると次に DataLoader が生成されたときもシード値が設定される。
    `get_dataloader` よりも前に本関数を実行すること。
    
    Parameters
    ----------
    seed : int
        seed 値
    
    Returns
    -------
    None
    """
    global _seed_exists, _seed
    _seed_exists = True
    _seed = seed
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    # "backends" is not a known member of module Pylance (reportGeneralTypeIssues) 
    # が下二行において発生するが，これは意図しているものらしい。詳しくは https://githubhot.com/repo/microsoft/pyright/issues/2232 を参照。
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True 

def _seed_worker(worker_id):
    worker_seed = torch.initial_seed() % 2**32
    np.random.seed(worker_seed)  
    random.seed(worker_seed)

def get_dataloader(
    ndarray_data: np.ndarray, # 配列を入力させてもいいが，各配列がちゃんとパディングされて一定の配列長になっていることを保証するため np.ndarray を入力させる。
    test_size: float = 0.1,
    batch_size: int = 512,
    train_test_shuffle: bool = True,
    use_cuda: bool = False, # refactoring 前はデフォルトで Cuda を使用している。フールプルーフでデフォルトを CPU 側にする。
    num_workers: int = 1,
    pin_memory: bool = False, # refactoring 前は GPU を使用する際デフォルトで True だった。確認していないが遺伝研の CPU で libgomp error 吐くならおそらくここが問題の可能性があるので今回はデフォルトで False にしている。ちなみにここを True にすると https://qiita.com/sugulu_Ogawa_ISID/items/62f5f7adee083d96a587#12-pin_memory の説明にあるとおり推論が早くなる。
    **kwargs
    ) -> Tuple[DataLoader, DataLoader]:
    """`ndarray_data` で提供される配列データをトレーニング用およびテスト用のデータセットに分割し，それぞれを `DataLoader` 形式で返却する。
    `set_seed(seed)` を実行した場合，分割結果も DataLoader のシードも `seed` で固定される。
    
    Parameters
    ----------
    ndarray_data : np.ndarray
        トレーニング用，テスト用に分割したいデータセット。
        各配列は `core.preprocessing.ID_encode()` で ID 化もしくは `core.preprocessing.one_hot_encode()` で one-hot 化されていなければならず，さらに全配列が同一配列長になるようにパディングされていなければならない。パディングを取り除く場合は `nn.Modules` によるモデル設計で行う。
    test_size : float, default = 0.1
        全体を 1 としたときのテスト用データの割合。
    batch_size : int, default = 512
        学習時のバッチの大きさ。
    train_test_shuffle : bool, default = True
        トレーニングデータ，テストデータを分割する際に元の `ndarray_data` に記述する順序を保持するかシャッフルするかを指定する。`True` 時は `ndarray_data` をシャッフルする。
    use_cuda : bool, default = False
        生成された DataLoader を使って CUDA を搭載した GPU 上で推論を行うかどうかを指定する。`True` で使用すると指定した際 `num_workers` 引数および `pin_memory` 引数が有効化される。
    num_workers : int, default = 1
        data loading を行う worker の数を指定する。`use_cuda = True` で CUDA が搭載された GPU 上で推論を行うと指定した際に有効になり，そうでない場合は `DataLoader` のコンストラクタで指定される `num_workers` は `0` となる。
    pin_memory : bool, default = False
        `True` の場合推論時に automatic memory pinning が適用され，計算が若干高速化される。詳しくは [ここ](https://qiita.com/sugulu_Ogawa_ISID/items/62f5f7adee083d96a587#12-pin_memory) を参照。
        `use_cuda = True` で CUDA が搭載された GPU 上で推論を行うと指定した際に有効になり，そうでない場合は `DataLoader` のコンストラクタで指定される `pin_memory` は `False` となる。
    
    Returns
    -------
    loaders : Tuple[DataLoader, DataLoader]
        タプルの中身は `train_loader, test_loader` であり，それぞれトレーニングデータ，テストデータの DataLoader である。
    """
    train_data, test_data = train_test_split(
        ndarray_data, test_size=test_size, shuffle=train_test_shuffle)
    train_data = TensorDataset(torch.from_numpy(train_data).long())
    test_data = TensorDataset(torch.from_numpy(test_data).long())
    # TensorDataset を使った際，next(iter(dataloader)) からタプルが発生することに注意。
    # TensorDataset の引数に Tensor を追加することで教師情報も取り出せるが，VAE は教師無しなので使わない。

    if use_cuda == True:
        kwargs['num_workers'] = num_workers
        kwargs['pin_memory'] = pin_memory
    else:
        pass

    if _seed_exists == True:
        gen = torch.Generator()
        gen.manual_seed(_seed)
        kwargs['worker_init_fn'] = _seed_worker
        kwargs['generator'] = gen

    train_loader = DataLoader(
        train_data,
        batch_size=batch_size, 
        shuffle=True,
        **kwargs
    )
    test_loader = DataLoader(
        test_data, 
        batch_size=batch_size, 
        shuffle=False, 
        **kwargs)

    return train_loader, test_loader

def train_VAE(
    num_epochs: int,
    model: VAE,
    train_loader: DataLoader[torch.Tensor],
    test_loader: DataLoader[torch.Tensor],
    optimizer: torch.optim.Optimizer,
    device: torch.device = torch.device("cpu"), # フォールトトレランス。
    loss_fn: Callable | None = None,
    early_stop_threshold: int = 20,
    beta_schedule: bool = False,
    beta_threshold: int = 20,
    force_matching: bool = False,
    force_epochs: int = 20,
    show_tqdm: bool = True,
    ) -> Tuple[VAE, pd.DataFrame]:
    """`train_loader` に示されるトレーニングデータを使用して，`model` で示される任意の VAE モデルをトレーニングする。
    `train_loader` 内の各データは `model` の `self.forward()` 関数の引数に投入され，返り値は `self.loss_fn` の引数に投入される。これにより損失量が計算され，逆誤差伝搬された後 `optimizer` で各パラメータが最適化される。
    
    各 epoch で `test_loader` を使用して汎化性能を計り，汎化性能を示す `test_loss` が `early_stop_threshold` 回連続で改善されないならば，もしくは epoch 回数が上限の `num_epochs` 回を超えたら，`test_loss` が最小の時のモデルを返却する。

    ただ `beta_schedule` が指定されている場合，最初の `beta_threshold` 回は weighted regularization を行う。
    また `force_matching` が指定されている場合，最初の `force_epochs` 回は state transition regularization を行う。

    Parameters
    ----------
    num_epochs : int
        トレーニングデータの学習を打ち切る最大回数。
    model : VAE
        学習させる `VAE(torch.nn.Modules)` 型由来の VAE モデル。
    train_loader : DataLoader[torch.Tensor]
        トレーニングデータを格納した DataLoader。
    test_loader : DataLoader[torch.Tensor]
        テストデータを格納した DataLoader。
    optimizer : torch.optim.Optimizer
        モデルの各パラメータを勾配から学習させる最適化手法。
    device : torch.device
        推論時に使用する CPU または GPU の計算リソース。DGX の GPU (ID:0) であれば `torch.device("cuda:0")` などと指定する。
    loss_fn : Callable or None, default = None
        モデルの `forward()` で得られた値からどのように損失値を計算するかを定義した損失関数。`None` の場合は `model` のクラスに付属している損失関数を使用する。
    early_stop_threshold : int, default = 20
        連続する `early_stop_threshold` 回の epoch において，テストデータの損失値である -log(ELBO) (すなわち `test_loss`) の最小値の更新が見られなかった場合に早期終了する。
    beta_schedule : bool, default = False
        `True` 時，最初の `beta_threshold` 回の epoch において weighted regularization を行う。
    beta_threshold : int, default = 20
        `beta_schedule` を参照。
    force_matching : bool, default = False
        `True` 時，最初の `force_epochs` 回の epoch において state transition regularization を行う。
    force_epochs : int, default = 20
        `force_matching` を参照。
    show_tqdm : bool, default = True
        tqdm を表示するかを決める。
    
    Returns
    -------
    result : Tuple[torch.nn.module, pd.DataFrame]
        テストデータの損失関数である -log(ELBO) が最小，すなわち ELBO が最大となるときのモデルと，トレーニングデータおよびテストデータ内に存在する塩基配列一本（データ点）あたりの平均 ELBO を epoch 毎に計算したもの，およびテストデータ内の塩基配列に対してはさらに再構成誤差と KL ダイバージェンスを計算した表を返却する。
    """
    best_model_state_dict = model.state_dict()
    patience = 0
    beta = 1.0
    train_loss_list = list()
    test_loss_list = list()
    kld_loss_list = list()
    ce_loss_list = list()

    if loss_fn is None:
        loss_fn = model.loss_fn
    
    try:
        with tqdm(total = num_epochs, disable = not show_tqdm) as pbar:
            description = ""

            for epoch in range(1, num_epochs + 1):
                if beta_schedule and epoch < beta_threshold:
                    beta = epoch / beta_threshold
                model.train()
                train_loss = 0
                test_kld = 0
                test_ce = 0

                # train_loader からはタプルが渡されることに注意。
                for batch, in train_loader:
                    batch = batch.to(device)
                    optimizer.zero_grad()
                    
                    if loss_fn == profile_hmm_vae_loss:
                        reconst_params, mus, logvars = model(batch)
                        transition_probs, emission_probs = reconst_params
                        if epoch <= force_epochs:
                            loss: torch.Tensor = loss_fn(
                                batch_input = batch,
                                transition_probs = transition_probs,
                                emission_probs = emission_probs,
                                mus = mus,
                                logvars = logvars,
                                beta = beta,
                                force_matching = force_matching,
                                match_cost = 1 + 4 * (1 - epoch / force_epochs)
                            )
                        else:
                            loss: torch.Tensor = loss_fn(
                                batch_input = batch,
                                transition_probs = transition_probs,
                                emission_probs = emission_probs,
                                mus = mus,
                                logvars = logvars,
                                beta = beta,
                                force_matching = False,
                            )
                    else:
                        loss: torch.Tensor = loss_fn(
                            batch,
                            *model(batch),
                            beta = beta
                        )
                    loss.backward()
                    train_loss += loss.item() * int(batch.shape[0])
                    # 損失関数はバッチ内で平均している。バッチ要素数をかけてバッチ毎の総損失量を計算。

                    optimizer.step()
                
                train_loss /= len(train_loader.dataset)
                # pylance がエラー発しているように，dataset 自体には __len__ は定義されているかどうか分からない（抽象クラス時点では定義されていない）。定義されている前提で進める。
                # train_loss は dataset を構成する塩基配列（各データ点）の平均損失値になる。

                if train_loss == np.nan:
                    raise Exception("NaN value appeared in calculating loss function")
                
                model.eval()
                
                with torch.no_grad():
                    for batch, in test_loader:
                        batch = batch.to(device)

                        if loss_fn == profile_hmm_vae_loss:
                            reconst_params, mus, logvars = model(batch)
                            transition_probs, emission_probs = reconst_params
                            ce, kld = loss_fn(
                                batch_input = batch,
                                transition_probs = transition_probs,
                                emission_probs = emission_probs,
                                mus = mus,
                                logvars = logvars,
                                split_ce_kld = True
                            )
                            test_ce += ce.item() * batch.shape[0]
                            test_kld += kld.item() * batch.shape[0]
                        else:
                            ce, kld = loss_fn(
                                batch,
                                *model(batch),
                                beta = beta,
                                test = True,
                            )
                            test_ce += ce * batch.shape[0]
                            test_kld += kld * batch.shape[0]

                    test_kld /= len(test_loader.dataset)
                    test_ce /= len(test_loader.dataset)
                    # Dataset の抽象クラスには __len__ は定義されていないので pylance に怒られている。

                test_loss = test_kld + test_ce

                if test_loss == np.nan:
                    raise Exception("NaN value appeared in calculating loss function")
                
                train_loss_list.append(train_loss)
                test_loss_list.append(test_loss)
                kld_loss_list.append(test_kld)
                ce_loss_list.append(test_ce)
                
                # pbar 周り
                patience_str = f"[{patience}]" \
                    if patience > 0 \
                    else ( "[" + "⠸⠴⠦⠇⠋⠙"[epoch % 6] + "]")
                description = f'{patience_str:>4}{epoch:4d} itr: train_loss {train_loss:6.2f} <-> test_loss {test_loss:6.2f} (ce:{test_ce:6.2f}, kld:{test_kld:6.2f})'
                pbar.set_description(description)
                pbar.update(1)

                # 終了条件
                #   テストデータの最小損失量の未更新が early_stop_threshold 回連続した時早期終了。
                #   または，未更新回数が early_stop_threshold 以下のまま全 epoch が終了。
                if np.min(test_loss_list) == test_loss:
                    patience = 0
                    best_model_state_dict = model.state_dict()
                    continue
                else:
                    patience += 1
                    if patience > early_stop_threshold:
                        break

    except Exception as e:
        if str(e) == "NaN value appeared in calculating loss function":
            train_loss_list.append(np.nan)
            test_loss_list.append(np.nan)
            kld_loss_list.append(np.nan)
            ce_loss_list.append(np.nan)
        else:
            raise e # 上流の判断を仰ぐ。

    loss_transition = pd.DataFrame({
        'epoch' : list(range(1, 1 + len(train_loss_list))),
        'train_loss' : train_loss_list,
        'test_loss' : test_loss_list,
        'test_recon' : ce_loss_list,
        'test_kld' : kld_loss_list,
    })
    model.load_state_dict(best_model_state_dict)
    return (model, loss_transition)
