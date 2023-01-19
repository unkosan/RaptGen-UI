#!/usr/bin/env python
# coding: utf-8

# todo: このファイルでは pHMM に関するアルゴリズムをまとめる。weblogo に関するアルゴリズムもここに集約する。

from itertools import groupby
from time import time
from typing import Callable, List, Tuple, Union
from matplotlib.axes import Axes
from torch import Tensor, nn
import torch.nn.functional as F
import torch
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from raptgen.core.preprocessing import Transition, NucleotideID, State, ID_encode

def kld_loss(mus: Tensor, logvars: Tensor):
    """KL Divergence 項（正則化項）の計算を行う。
    
    Parameters
    ----------
    mus : Tensor
        エンコーダで潜在空間上に投影されるガウス分布の平均ベクトルのバッチセット。
        (`batch`, `embed_dim`) の 2 次元構成である必要がある。
    logvars: Tensor
        エンコーダで潜在空間上に投影されるガウス分布の分散ベクトルのバッチセット。
        (`batch`, `embed_dim`) の 2 次元構成である必要がある。
        
    Returns
    -------
    kl_divergences : Tensor
        バッチの各要素毎で KL 距離を計算した値のセット。
        (`batch`, ) の一次元構成である。
    """
    kl_divergence = - 0.5 * torch.sum(1 + logvars - mus.pow(2) - logvars.exp(), dim=1)
    return kl_divergence

def profile_hmm_vae_loss(
    batch_input: Tensor, 
    transition_probs: Tensor,
    emission_probs: Tensor,
    mus: Tensor, 
    logvars: Tensor, 
    beta: float = 1, 
    force_matching: bool = False, 
    match_cost: float = 5,
    split_ce_kld: bool = False,
    ) -> Tensor:
    """pHMM デコーダを使用する際の損失関数。

    Parameters
    ----------
    batch_input : Tensor
        VAE モデルに入力したバッチの値。(`batch`, `string_length`) の 2 次元構成になっている必要があり，各塩基は `NucleotideID` に示された値で表現されていなければならない。パディングも許可される。
    transition_probs : Tensor
        pHMM の遷移確率。(`batch`, `model_length`+1, `combi of 'from' and 'to'`) の 3 次元構成になっており，全確率は対数で表現されていることとする。
    emission_probs : Tensor
        pHMM の出力確率。(`batch`, `model_length`, `nucleotide_type`=4) の 3 次元構成になっている必要があり，全確率は対数で表現されていることとする。
    mus : Tensor
        エンコーダで潜在空間上に投影されるガウス分布の平均ベクトルのバッチセット。
        (`batch`, `embed_dim`) の 2 次元構成である必要がある。
    logvars : Tensor
        エンコーダで潜在空間上に投影されるガウス分布の分散ベクトルのバッチセット。
        (`batch`, `embed_dim`) の 2 次元構成である必要がある。
    beta : float, default = 1
        再構成誤差項に対する正則化項の影響度の割合。
        例えば `beta = 2` であれば損失関数は 再構成誤差項 + `beta`×正則化項 ということになる。
    force_matching : bool
        遷移確率において matching to matching への遷移にペナルティを科すかを決定する。`True` のときペナルティを科す。
    match_cost : float, default = 5.0
        Matching の方に傾く度合いを示す。大きいほど matching to matcing への傾向が高くなる。`1` のとき他の `combi of 'from' and 'to'` と重みが等しくなる。
    split_ce_kld : True, default = False
        返却時に再構成誤差項と正則化項を別々に分けたテンソルとして返却するかを指定する。これを指定するとき，`beta = 1` となる。
    
    Returns
    -------
    vae_loss : Tensor
        batch 内の各要素に対する ELBO の平均値が出力される。
        `split_ce_kld` を指定した際は再構成誤差項と正則化項のそれぞれの平均値が結合されたテンソルとして出力される。
    """
    assert(batch_input.dim() == 2)
    assert(transition_probs.dim() == 3)
    assert(emission_probs.dim() == 3)
    assert(mus.dim() == 2)
    assert(logvars.dim() == 2)

    reconstruction_error = profile_hmm_loss(
        transition_probs = transition_probs, 
        emission_probs = emission_probs,
        batch_input = batch_input,
    ).mean()

    if force_matching == True:
        reconstruction_error += force_matching_loss(
            transition_probs = transition_probs,
            match_cost = match_cost,
        ).mean()

    regularization_error = kld_loss(mus, logvars).mean()

    if split_ce_kld == True:
        return torch.stack([reconstruction_error, regularization_error])
    else:
        return reconstruction_error + beta * regularization_error

def _masked_select_1D(input: Tensor, mask: Tensor):
    """N 次元配列の dim=0 を 1 次元 mask でフィルタリングする。`torch.masked_select` はフィルタリングされる配列と mask 配列の形状が同じである必要がある"""
    assert mask.dim() == 1 and mask.dtype == torch.bool
    num_true = int(torch.sum(mask).item())
    output_shape = torch.Size([num_true]) + input.shape[1:]
    for _ in range(input.dim() - 1):
        mask = mask.unsqueeze(-1)
    expanded_mask = mask.expand(input.size())
    return torch.masked_select(input, expanded_mask).reshape(output_shape)

def profile_hmm_loss(
    transition_probs: Tensor, 
    emission_probs: Tensor,
    batch_input: Tensor, 
    ) -> Tensor:
    """pHMM の遷移確率と出力確率をとり，`batch_input` で示された元の配列が生成される確率を計算する。
    
    Parameters
    ----------
    transition_probs : Tensor
        pHMM の遷移確率。(`batch`, `model_length`+1, `combi of 'from' and 'to'`) の 3 次元構成になっており，全確率は対数で表現されていることとする。
    emission_probs : Tensor
        pHMM の出力確率。(`batch`, `model_length`, `nucleotide_type`=4) の 3 次元構成になっている必要があり，全確率は対数で表現されていることとする。
    batch_input : Tensor
        VAE モデルに入力したバッチの値。(`batch`, `string_length`) の 2 次元構成になっている必要があり，各塩基は `NucleotideID` に示された値で表現されていなければならない。パディングも許可される。
    
    Returns
    -------
    probs : Tensor
        遷移確率，出力確率が決まっていた際に `batch_input` が生成された確率。
        (`batch`,) の 1 次元構成になっている。
    """
    batch_size = batch_input.shape[0]
    motif_len = emission_probs.shape[1]

    # 各配列の長さ取得
    lengths = torch.sum(batch_input != NucleotideID.PAD, dim = 1)
    indeces = Tensor(range(batch_size))
    unique_lengths = set(lengths.tolist())

    result_list = list()
    for seq_length in unique_lengths:
        mask = lengths.eq(seq_length)
        set_size = int(mask.sum().item())

        index_set = torch.masked_select(indeces, mask)
        a_set = _masked_select_1D(transition_probs, mask)
        e_m_set = _masked_select_1D(emission_probs, mask)

        input_seq_set = _masked_select_1D(batch_input, mask)
        input_seq_set = input_seq_set \
            .masked_select(input_seq_set.ne(NucleotideID.PAD)) \
            .reshape(set_size, seq_length)

        # forward アルゴリズムを対数形式で行う。
        # (match or insert or delete, motif_len, random_len) の三次元の動的計画表を用意する。
        f_set = torch.ones(
            size = (set_size, 3, motif_len + 1, seq_length + 1),
            device = input_seq_set.device
        ) * (-100)
        f_set[:, State.M, 0, 0] = 0

        for l in range(seq_length + 1): # locus starts from '1'
            for k in range(motif_len + 1): # motif starts from '1' but model starts from '0'
                # for state M
                if l != 0 and k != 0:
                    f_set[:, State.M, k, l] \
                        = e_m_set[:, k-1] \
                            .gather(1, input_seq_set[:, l-1:l])[:, 0] \
                        + torch.logsumexp(torch.stack((
                            a_set[:, k-1, Transition.M2M] + f_set[:, State.M, k-1, l-1],
                            a_set[:, k-1, Transition.I2M] + f_set[:, State.I, k-1, l-1],
                            a_set[:, k-1, Transition.D2M] + f_set[:, State.D, k-1, l-1],
                        )), dim=0)
                # for state I
                if l != 0:
                    f_set[:, State.I, k, l] \
                        = np.log(1/4) \
                        + torch.logsumexp(torch.stack((
                            a_set[:, k, Transition.M2I] + f_set[:, State.M, k, l-1],
                            a_set[:, k, Transition.I2I] + f_set[:, State.I, k, l-1],
                        )), dim=0)
                # for state D
                if k != 0:
                    f_set[:, State.D, k, l] \
                        = torch.logsumexp(torch.stack((
                            a_set[:, k-1, Transition.M2D] + f_set[:, State.M, k-1, l],
                            a_set[:, k-1, Transition.D2D] + f_set[:, State.D, k-1, l],
                        )), dim=0)
        
        f_set[:, State.M, motif_len, seq_length] += a_set[:, motif_len, Transition.M2M]
        f_set[:, State.I, motif_len, seq_length] += a_set[:, motif_len, Transition.I2M]
        f_set[:, State.D, motif_len, seq_length] += a_set[:, motif_len, Transition.D2M]

        val_set = - torch.logsumexp(f_set[:, :, motif_len, seq_length], dim=1)

        result_list += list(zip(
            index_set.tolist(),
            val_set.split(1),
        ))

    result_sorted = sorted(
        result_list, 
        key = lambda x: x[0],
    )
    
    result_tensor = torch.stack([
        value_tuple[1]
        for value_tuple in result_sorted
    ])

    return result_tensor

def force_matching_loss(transition_probs: Tensor, match_cost: float = 5.0) -> Tensor:
    """遷移確率において，Match to Match の確率が小さければ小さい程大きな損失値を与える損失関数を定義する。
    これを初期 epoch における損失関数に付け加えることにより，モチーフの学習がうまくいく。論文中では State_transition_loss として定義されている。
    
    Parameters
    ----------
    transition_probs : Tensor
        遷移確率。(`batch`, `model_length`+1, `combi of 'from' and 'to'`) の三次元配列。
    match_cost : float, default = 5.0
        Matching の方に傾く度合いを示す。大きいほど matching to matcing への傾向が高くなる。`1` のとき他の `combi of 'from' and 'to'` と重みが等しくなる。
    
    Returns
    -------
    force_matching_loss : Tensor
        Matching to Matcing の確率が全体的に小さいほど大きくなるような損失関数。
        (`batch`, ) の一次元構成になっている。
    """
    loss \
        = np.log( (match_cost + 1) * match_cost / 2 ) \
        + torch.sum(
            (match_cost - 1) * transition_probs[:, :, Transition.M2M], 
            dim=1,
        )
    return - loss

class VAE(nn.Module):
    loss_fn: Callable[..., Tensor]
    # 再構成誤差項と正則化項を足し合わせて返却するか，別々に返却するか。
    embed_size: int
    # 埋め込み空間の次元数。

    def __init__(self, encoder, decoder, embed_size=10, hidden_size=32):
        super(VAE, self).__init__()
        self.embed_size = embed_size

        self.encoder = encoder
        self.decoder = decoder

        self.h2mu = nn.Linear(hidden_size, embed_size)
        self.h2logvar = nn.Linear(hidden_size, embed_size)

    def reparameterize(self, mu, logvar, deterministic=False):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        z = mu + (std * eps if not deterministic else 0)
        return z

    def forward(self, input, deterministic=False):
        h = self.encoder(input)
        mu = self.h2mu(h)
        logvar = self.h2logvar(h)

        z = self.reparameterize(mu, logvar, deterministic)
        recon_param = self.decoder(z)
        return recon_param, mu, logvar

class EncoderCNN (nn.Module):
    # 0~3 is already used by embedding ATGC
    def __init__(self, embedding_dim=32, window_size=7, num_layers=6):
        super(EncoderCNN, self).__init__()
        self.embedding_dim = embedding_dim
        self.window_size = window_size

        self.embed = nn.Embedding(
            num_embeddings = 5,  # [A,T,G,C,PAD]
            embedding_dim = embedding_dim,
            padding_idx = NucleotideID.PAD,
        )

        modules = [Bottleneck(embedding_dim, window_size)
                   for _ in range(num_layers)]
        self.resnet = nn.Sequential(*modules)

    def forward(self, seqences):
        # change X from (N, L) to (N, L, C)
        x = F.leaky_relu(self.embed(seqences))

        # change X to (N, C, L)
        x = x.transpose(1, 2)
        value, indices = self.resnet(x).max(dim=2)
        return value

class DecoderPHMM(nn.Module):
    # tile hidden and input to make x
    def __init__(self, motif_len, embed_size, hidden_size=32):
        super(DecoderPHMM, self).__init__()

        class View(nn.Module):
            def __init__(self, shape):
                super(View, self).__init__()
                self.shape = shape

            def forward(self, x):
                return x.view(*self.shape)

        self.fc1 = nn.Sequential(
            nn.Linear(embed_size, hidden_size),
            nn.BatchNorm1d(hidden_size),
            nn.LeakyReLU(negative_slope=0.01, inplace=True))

        self.fc2 = nn.Sequential(
            nn.Linear(hidden_size, hidden_size*2),
            nn.BatchNorm1d(hidden_size*2),
            nn.LeakyReLU(negative_slope=0.01),
            nn.Linear(hidden_size*2, hidden_size),
            nn.BatchNorm1d(hidden_size),
            nn.LeakyReLU(negative_slope=0.01)
        )

        self.tr_from_M = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.LeakyReLU(negative_slope=0.01, inplace=True),
            nn.Linear(hidden_size, (motif_len+1)*3),
            nn.LeakyReLU(negative_slope=0.01, inplace=True),
            View((-1, motif_len+1, 3)),
            nn.LogSoftmax(dim=2)
        )
        self.tr_from_I = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.LeakyReLU(negative_slope=0.01, inplace=True),
            nn.Linear(hidden_size, (motif_len+1)*2),
            nn.LeakyReLU(negative_slope=0.01, inplace=True),
            View((-1, motif_len+1, 2)),
            nn.LogSoftmax(dim=2)
        )
        self.tr_from_D = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.LeakyReLU(negative_slope=0.01, inplace=True),
            nn.Linear(hidden_size, (motif_len+1)*2),
            nn.LeakyReLU(negative_slope=0.01, inplace=True),
            View((-1, motif_len+1, 2)),
            nn.LogSoftmax(dim=2)
        )

        self.emission = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.LeakyReLU(negative_slope=0.01, inplace=True),
            nn.Linear(hidden_size, motif_len*4),
            nn.LeakyReLU(negative_slope=0.01, inplace=True),
            View((-1, motif_len, 4)),
            nn.LogSoftmax(dim=2)
        )

    def forward(self, input):
        x = self.fc1(input)

        transition_from_match = self.tr_from_M(x)
        transition_from_insertion = self.tr_from_I(x)
        transition_from_deletion = self.tr_from_D(x)

        emission_proba = self.emission(x)
        return (torch.cat((
            transition_from_match,
            transition_from_insertion,
            transition_from_deletion), dim=2), emission_proba)

class Bottleneck(nn.Module):
    def __init__(self, init_dim=32, window_size=7):
        super(Bottleneck, self).__init__()
        assert window_size % 2 == 1, f"window size should be odd, given {window_size}"

        self.conv1 = nn.Conv1d(
            in_channels=init_dim,
            out_channels=init_dim*2,
            kernel_size=1)

        self.conv2 = nn.Conv1d(
            in_channels=init_dim*2,
            out_channels=init_dim*2,
            kernel_size=window_size,
            padding=window_size//2
        )

        self.conv3 = nn.Conv1d(
            in_channels=init_dim*2,
            out_channels=init_dim,
            kernel_size=1)

        self.bn1 = nn.BatchNorm1d(init_dim)
        self.bn2 = nn.BatchNorm1d(init_dim*2)
        self.bn3 = nn.BatchNorm1d(init_dim*2)

    def forward(self, input):
        x = self.conv1(F.leaky_relu(self.bn1(input)))
        x = self.conv2(F.leaky_relu(self.bn2(x)))
        x = self.conv3(F.leaky_relu(self.bn3(x)))
        return F.leaky_relu(x+input)

class CNN_PHMM_VAE(VAE):
    def __init__(self, motif_len=12, embed_size=10, hidden_size=32, kernel_size=7):
        encoder = EncoderCNN(hidden_size, kernel_size)
        decoder = DecoderPHMM(motif_len, embed_size)

        super(CNN_PHMM_VAE, self).__init__(
            encoder, decoder, embed_size, hidden_size)
        self.loss_fn = profile_hmm_vae_loss

def embed_sequences(
    sequences: List[str], 
    model: VAE
    ) -> List[np.ndarray]:
    """対応する埋め込み空間の値を返却する。
    
    Parameters
    ----------
    sequences : List[str]
        各残基が `A, U, C, G` で表現された塩基配列のリスト。
    model : VAE
        埋め込みに使用する VAE モデル。
    
    Returns
    -------
    coords : List[np.ndarray]
        `sequences` に対応する埋め込み値
    """
    assert(type(sequences) == list)
    
    # https://discuss.pytorch.org/t/how-to-check-if-model-is-on-cuda/180
    model_device = next(model.parameters()).device
    with torch.no_grad():
        model.eval()
        coords: List[np.ndarray] = list()

        for _, group_it in groupby(sequences, len):
            encoded_seqs: List[List[int]] = list(map(ID_encode, group_it))
            recon, mu, logvar = model(
                torch.Tensor(
                    np.array(encoded_seqs),
                    device=model_device
                ).long()
            )
            mu_list = list(mu.to('cpu').detach().numpy().copy())
            coords += mu_list
    
    return coords

def get_most_probable_seq(
    coords: List[np.ndarray],
    model: CNN_PHMM_VAE,
    proba_is_log: bool = True,
    ) -> Tuple[List[str], List[List[Tuple[int, int]]]]:
    """座標に対応する pHMM モデルにおいて，最も生成されやすい配列を計算する。
    配列生成時の状態パスも書き出す。
    
    Parameters
    ----------
    coords : List[np.ndarray]
        座標値のリスト。
    model : CNN_PHMM_VAE
        埋め込み値から pHMM のパラメータを計算する VAE モデル。
    proba_is_log : bool = True
        `model` の pHMM-decoder が生成する出力確率および遷移確率が対数で表現されている場合 True, そうでない場合 False となる。

    Returns
    -------
    seqs_states_tuple : Tuple[List[str], List[List[Tuple[int, int]]]] 
        一つ目は最も生成されやすい配列を順に計算したリスト，二つ目は一つ目のリストが生成されるときの最適状態列。タプルの一つ目が配列の座位で，二つ目が `State`。
    """
    assert(np.array(coords).shape[1] == model.embed_size)

    sequences = list()
    states_transit = list()

    for coord in coords:
        transition_probs, emission_probs \
            = model.decoder(torch.Tensor([coord]))
        a_probs: np.ndarray = transition_probs.detach().numpy()[0]
        e_probs: np.ndarray = emission_probs.detach().numpy()[0]
        if proba_is_log:
            a_probs = np.exp(a_probs)
            e_probs = np.exp(e_probs)

        index, state = 0, State.M
        states: List[Tuple[int, int]] = [(index, state)]
        seq = ""
        while True:
            a_prob: np.ndarray = a_probs[index]
            if state == State.M:
                next_transit_prob = a_prob.take([
                    Transition.M2M,
                    Transition.M2I,
                    Transition.M2D,
                ])
            elif state == State.I:
                next_transit_prob = np.array([
                    a_prob[Transition.I2M],
                    0,
                    0,
                ])
            elif state == State.D:
                next_transit_prob = np.array([
                    a_prob[Transition.D2M],
                    0,
                    a_prob[Transition.D2D],
                ])
            else:
                raise Exception()

            # update state and index
            state = State(next_transit_prob.argmax())
            if state != State.I:
                index += 1
            states.append((index, state))

            # finish with
            if index == len(a_probs):
                break

            # update nucleotides string
            if state == State.M:
                e_prob: np.ndarray = e_probs[index - 1]
                seq += "ATGC"[e_prob.argmax()]
            elif state == State.I:
                seq += "N"
            else: # equals to State.D
                seq += "_"
            
        sequences.append(seq)
        states_transit.append(states)

    return sequences, states_transit

def draw_logo(
    ax: Axes,
    coord: np.ndarray, 
    model: CNN_PHMM_VAE,
    is_RNA: bool = True,
    calc_h_em: bool = True,
    correction: float = 0,
    font_file: str = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    ) -> Axes:

    assert coord.ndim == 1

    red = "#d50000"
    green = "#00d500"
    blue = "#0000c0"
    yellow = "#ffaa00"

    if is_RNA:
        nucleotides = list("AUGC")
    else:
        nucleotides = list("ATGC")

    res = dict()
    for text, color in zip(nucleotides, [green, red, yellow, blue]):
        img = Image.new('RGBA', (200, 300), (255, 255, 255, 0))
        font = ImageFont.truetype(font_file, size=200)
        drawer = ImageDraw.Draw(img)
        drawer.text((10, 10), text, fill=color, font=font)
        img = img.crop(img.getbbox())
        res[text] = img
    
    emission_probs: np.ndarray \
        = model \
            .decoder(torch.Tensor([coord]))[1] \
            .detach().numpy()[0]
    
    e_prob_list = list()
    for index, state in get_most_probable_seq(
        coords = [coord],
        model = model,
        proba_is_log = True,
    )[1][0]: # head of states list
        if not 0 < index <= len(emission_probs):
            continue

        if state == State.M:
            e_prob_list.append(np.exp(emission_probs[index - 1]))
        elif state == State.I:
            e_prob_list.append(np.ones((4)) * 0.25)

    e_probs = np.stack(e_prob_list)
    length = len(e_probs)

    if calc_h_em:
        p = e_probs.T
        h = -p * np.log2(p+1e-30)
        r = 2 - np.sum(h, axis=0, keepdims=True) - correction
        h_em = (p * r).T
    else:
        h_em = e_probs

    c_h = int(ax.bbox.height)
    if calc_h_em == True:
        ylim = 2
    else:
        ylim = 1
    unit_c_h = c_h / ylim # 0 to ylim bit

    c_w = int(ax.bbox.width)
    width = c_w // len(h_em)

    canvas = Image.new('RGBA', (c_w, c_h), (255, 255, 255, 0))
    w_offset = 0
    for a, t, g, c in h_em:
        h_offset = 0
        w = width
        for i in np.argsort([a, t, g, c])[::-1]:
            h = int(unit_c_h*[a, t, g, c][i])
            if h != 0: # when matching rather than insertion
                canvas.paste(
                    res[nucleotides[i]].resize((w, h), Image.BOX),
                    (w_offset, c_h - h_offset - h),
                )
            h_offset += h
        w_offset += w

    ax.imshow(np.asarray(canvas), zorder=1)
    ax.set_xticks(np.arange(length)*width + width//2)
    ax.set_xticklabels(1+np.arange(length))
    ax.set_yticks(np.array([0, 0.25, 0.5, 0.75, 1]) * ylim * unit_c_h)
    ax.set_yticklabels(np.array([1, 0.75, 0.5, 0.25, 0]) * ylim)
    ax.xaxis.grid(False)

    return ax