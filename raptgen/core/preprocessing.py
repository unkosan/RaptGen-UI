from copy import copy, deepcopy
from enum import IntEnum
import numpy as np
import pandas as pd
from typing import Callable, List, Tuple
from Bio.Seq import Seq
from Bio import SeqIO
from pathlib import Path

class State(IntEnum):
    M = 0
    I = 1
    D = 2

class Transition(IntEnum):
    M2M = 0
    M2I = 1
    M2D = 2
    I2M = 3
    I2I = 4
    D2M = 5
    D2D = 6

class NucleotideID(IntEnum):
    A = 0
    T = 1
    G = 2
    C = 3
    PAD = 4
    SOS = 5
    EOS = 6
    U = 1

def one_hot_encode(
    seq: str or Seq,
    left_padding: int = 0,
    right_padding: int = 0,
    padding_template: np.ndarray = np.array([0, 0, 0, 0]),
    ) -> np.ndarray:
    """
    単一配列を one-hot の numpy ベクトルに変換する。
    
    Parameters
    ----------
    seq : str or Bio.Seq.Seq
        ヌクレオチド鎖の情報。DNA, RNA いずれも対応するが，チミン塩基・ウラシル塩基は別々に考慮されない。
    left_padding : int, default 0
        左側（5'末端）に付加されるパディング塩基の数。
    right_padding : int, default 0
        右側（3'末端）に付加されるパディング塩基の数。
    padding_template: np.ndarray, default np.array([0, 0, 0, 0])
        パディング塩基の配列表現。
    
    Returns
    -------
    encoded_sequence : np.ndarray
        `seq` 配列を one-hot 化した 2 次元配列
    
    Examples
    --------
    >>> print(one_hot_encode("ATCGATG"))
    array([[1, 0, 0, 0],
           [0, 1, 0, 0],
           [0, 0, 0, 1],
           [0, 0, 1, 0],
           [1, 0, 0, 0],
           [0, 1, 0, 0],
           [0, 0, 1, 0]])
    >>> print(one_hot_encode("AUG"))
    array([[1, 0, 0, 0],
           [0, 1, 0, 0],
           [0, 0, 1, 0]])
    >>> print(one_hot_encode("AUG", left_padding=1, right_padding=2))
    array([[0, 0, 0, 0],
           [1, 0, 0, 0],
           [0, 1, 0, 0],
           [0, 0, 1, 0],
           [0, 0, 0, 0],
           [0, 0, 0, 0]])
    >>> print(one_hot_encode("AUG", left_padding=1, right_padding=1, padding_template=np.array([0.25, 0.25, 0.25, 0.25])))
    array([[0.25, 0.25, 0.25, 0.25]])
           [1, 0, 0, 0],
           [0, 1, 0, 0],
           [0, 0, 1, 0],
           [0.25, 0.25, 0.25, 0.25]])
    """
    ID_list = [int(NucleotideID[char]) for char in seq]
    one_hot_seq = np.zeros((len(ID_list), 4))
    for enum_index, nuc_ID in enumerate(ID_list):
        one_hot_seq[enum_index][nuc_ID] = 1
    
    encoded_sequence = np.array(np.vstack((
        *map(np.copy, [padding_template] * left_padding),
        one_hot_seq,
        *map(np.copy, [padding_template] * right_padding),
    )))

    return encoded_sequence

def one_hot_decode(
    encoded_sequence: np.ndarray,
    padding_template: np.ndarray = np.array([0, 0, 0, 0]),
    is_RNA: bool = True,
    ) -> str:
    """
    `one_hot_encode(seq)` で one-hot 化された numpy 配列から元となるヌクレオチド配列を取得する。
    ただし，パディング塩基は除去する。
    
    Parameters
    ----------
    encoded_sequence : np.ndarray
        one-hot 化された numpy 配列。
    padding_template : np.ndarray
        `one_hot_encode(padding_template)` で引数として投入したのと同じパディング塩基の one-hot 表現。
    is_RNA : bool, default True
        出力される配列が RNA 配列になる。`False` を入れた場合 DNA 配列になる。
    
    Returns
    -------
    decoded_sequence : str
        one-hot 化される前の塩基配列表現
    """
    decoded_char_list = list()
    for row_index in range(encoded_sequence.shape[0]):
        row = encoded_sequence[row_index]
        if row == padding_template:
            continue
        else:
            index = np.where(row == 1)[0]
            ID = NucleotideID(index)
            # IntEnum で複数変数を同一の値に結びつけた際，値は最初に結びつけられた変数に優先的に結びつけられる。
            if ID == NucleotideID.T and is_RNA:
                char = 'U'
            else:
                char = ID.name
            decoded_char_list.append(char)
    
    decoded_sequence = ''.join(decoded_char_list)
    return decoded_sequence

def ID_encode(
    seq: str or Seq,
    left_padding: int = 0,
    right_padding: int = 0,
    ) -> List[int]:
    """
    単一配列に対し，パディング塩基を含めた各核酸塩基を `NucleotideID` に対応づけられている数値 (ID) に変換したリストを返却する。
    この形状は `torch.nn.Embedding` に対応したフォーマットであり扱いやすいため，通常は `one_hot_encode()` よりもこちらを使用する。

    パディングを行う際は，パディング塩基に対応する ID に対して `Embedding(..., padding_idx=padding_ID)` を指定することを忘れないようにすること。これによりパディング塩基の埋め込み表現が学習されることはなくなる。詳しくは [pytorch の公式ドキュメント](https://pytorch.org/docs/stable/generated/torch.nn.Embedding.html) および [日本語解説](https://gotutiyan.hatenablog.com/entry/2020/09/02/200144) を読むこと。
    
    `one_hot_encoding()` を用いて同値のモデルを作成するには，one-hot ベクトル入力直後に一つ learnable な結合層を追加する必要がある。
    
    Parameters
    ----------
    seq : str or Bio.Seq.Seq
        ヌクレオチド鎖の情報。DNA, RNA いずれも対応するが，チミン塩基・ウラシル塩基は別々に考慮されない。
    left_padding : int, default 0
        左側（5'末端）に付加されるパディング塩基の数。
    right_padding : int, default 0
        右側（3'末端）に付加されるパディング塩基の数。
    
    Returns
    -------
    encoded_ID_sequence : List[int]

    Examples
    --------
    >>> print(ID_encode("ATCGATG"))
    [0, 1, 3, 2, 0, 1, 2]
    >>> print(ID_encode("AUG"))
    [0, 1, 2]
    >>> print(ID_encode("AUG", left_padding=1, right_padding=2))
    [4, 0, 1, 2, 4, 4]
    """
    ID_list = [int(NucleotideID[char]) for char in seq]
    encoded_ID_sequence = (
        [int(NucleotideID.PAD)] * left_padding
        + ID_list
        + [int(NucleotideID.PAD)] * right_padding
    )
    return encoded_ID_sequence

def ID_decode(
    encoded_sequence: List[int],
    is_RNA: bool = True,
    ) -> str:
    """
    `ID_encode(seq)` で各核酸塩基が ID 表現に変換された塩基配列から元となるヌクレオチド配列を取得する。
    ただし，パディング塩基は除去する。
    
    Parameters
    ----------
    encoded_sequence : List[int]
        ID 表現にされた塩基配列。
    is_RNA : bool, default True
        出力される配列が RNA 配列になる。`False` を入れた場合 DNA 配列になる。
    
    Returns
    -------
    decoded_sequence : str
        ID の List で表現される前の塩基配列表現

    Examples
    --------
    >>> print(ID_decode([4, 0, 1, 2, 4]))
    AUG
    >>> print(ID_decode([4, 0, 1, 2, 4], is_RNA=False))
    ATG
    """
    decoded_char_list = list()

    for ID_int in encoded_sequence:
        ID = NucleotideID(ID_int)
        if ID == NucleotideID.T and is_RNA:
            char = 'U'
        elif ID == NucleotideID.PAD:
            continue
        else:
            char = ID.name
        decoded_char_list.append(char)
    
    decoded_sequence = ''.join(decoded_char_list)
    return decoded_sequence

def calc_target_length(raw_reads: List[str]) -> int:
    """`str` 型で表現される塩基配列の配列長を list にわたって計算し，配列長の最頻値を返却する。
    配列長によるフィルタリングにおいて使用する。
    
    Paramters
    ---------
    raw_reads : List[str]
        各塩基が `'ATCGU'` のいずれかで示される `str` 型の塩基配列表現を list にした HT-SELEX データ。
    
    Returns
    -------
    target_length : int
        配列長の最頻値。
    """
    from collections import Counter
    counter = Counter([
        len(read) for read in raw_reads
    ])
    target_length = counter.most_common(1)[0][0]

    return target_length

def estimate_adapters(
    raw_reads : List[str], 
    target_length : int,
    ) -> Tuple[str, str]:
    """経験的手法で HT-SELEX データの各 reads 配列の 5' および 3' 末端に存在する固定配列部分を同定する。入力データはいかなるフィルタリングも受けていない状況であることが望ましい。
    
    Parameters
    ----------
    raw_reads : List[str]
        各塩基が `'ATCGU'` のいずれかで示される `str` 型の塩基配列表現を list にした HT-SELEX データ。
    target_length : int
        配列長の最頻値。`calc_target_length(raw_reads)` によって計算可能。
    
    Returns
    -------
    adapters : Tuple[str, str]
        タプルの中身は `(fwd_adapter, bwd_adapter)` であり，それぞれ 5' 末端側，3' 末端側の固定配列部分を推測したものである。
    """
    from collections import Counter, defaultdict
    read_counter = Counter(raw_reads)

    # fwd
    max_count = None
    est_adapter = ""
    for i in range(1, target_length):
        d = defaultdict(int)
        for seq, count in read_counter.most_common():
            if len(seq) < i or len(d) > 100 and seq[:i] not in d.keys():
                continue
            d[seq[:i]] += count
        top_seq, top_count = sorted(d.items(), key=lambda x: -x[1])[0]
        if max_count is not None and top_count < max_count * 0.5:  # heuristics
            break
        max_count = sorted(d.items(), key=lambda x: -x[1])[0][1]
        if max_count < sum(read_counter.values()) * 0.5:
            break
        est_adapter = top_seq
    fwd_adapter = est_adapter

    # rev
    max_count = None
    est_adapter = ""
    for i in range(1, target_length):
        d = defaultdict(int)
        for seq, count in read_counter.most_common():
            if len(seq) < i or len(d) > 100 and seq[-i:] not in d.keys():
                continue
            d[seq[-i:]] += count
        top_seq, top_count = sorted(d.items(), key=lambda x: -x[1])[0]
        if max_count is not None and top_count < max_count * 0.5:  # heuristics
            break
        max_count = sorted(d.items(), key=lambda x: -x[1])[0][1]
        if max_count < sum(read_counter.values()) * 0.5:
            break
        est_adapter = top_seq
    rev_adapter = est_adapter

    return (fwd_adapter, rev_adapter)

def default_filterfunc(
    read: str, 
    fwd_adapter: str,
    rev_adapter: str,
    target_length: int,
    tolerance: int = 0,
    ) -> bool:
    """HT-SELEX データから有効な reads を `get_filtered_mask()` でフィルタリングする際にデフォルトで行われるフィルタリング関数。当該 read が `fwd_adapter` および `rev_adapter` に示される固定配列を持っており，かつ長さが `target_length ± tolerance` に収まっている場合にフィルタリングを通過させる。
    
    Parameters
    ----------
    read : str
        各塩基が `'ATCGU'` のいずれかで示される `str` 型の単一塩基配列。`fwd_adapter` および `rev_adapter` を除去していないものとする。
    fwd_adapter : str
        5' 末端側の固定塩基配列を `'ATCGU'` の `str` で表したもの。
    rev_adapter : str
        3' 末端側の固定塩基配列を `'ATCGU'` の `str` で表したもの。
    target_length : int
        HT-SELEX データにおける配列長の最頻値。ただし対象の HT-SELEX データは `fwd_adapter` および `rev_adapter` を除去していないものとする。
    tolerance : int, default = 0
        `target_length` を基準として `± tolerance` 分だけ配列長を許容する。
    
    Returns
    -------
    mask : bool
        当該単一塩基配列 `read` が `fwd_adapter` および `rev_adapter` に示される固定配列を持っており，かつ配列長（`len(read)`）が `target_length ± tolerance` に収まっている場合に `True` を返す。
        一つでも満たさない場合は `False` を返す。
    """
    has_forward = read.startswith(fwd_adapter)
    has_reverse = read.endswith(rev_adapter)
    match_random_region_len = abs(
        len(read) - target_length
    ) <= tolerance
    return has_forward and has_reverse and match_random_region_len

def get_filtered_mask(
    raw_reads : List[str],
    kwargs_to_filterfunc : dict,
    filterfunc : Callable[..., bool] = default_filterfunc,
    ) -> List[bool]:
    """`raw_reads` で示される HT-SELEX データの各配列を引数に入れて `filterfunc` がフィルタリングを行う。フィルタリングが通過する / 通過しない配列に対して順次 `True` / `False` 値を並べていった mask list を返却する。
    
    Parameters
    ----------
    raw_reads : List[str]
        各塩基が `'ATCGU'` のいずれかで示される `str` 型の塩基配列表現を list にした HT-SELEX データ。
    filterfunc : Callable[[str, ...], bool], default = default_filterfunc
        各 read 配列に対してかけるフィルタリング関数。各 read 配列は各塩基が `'ATCGU'` のいずれかで示される `str` 型の単一塩基配列でなければならなず，`filterfunc` 関数内では `read: str` と名付けられた引数名によって参照されなければならない
    kwargs_to_filterfunc : dict
        `filterfunc` に引き渡されるキーワード引数とその値をまとめたディクショナリ。
    
    Returns
    -------
    mask_list : List[bool]
        `raw_reads` の各配列に対して，`filterfunc` のフィルタリングが通れば `True`, 通らなければ `False` となるように作成した list。
    """
    mask_list = list()
    for read in raw_reads:
        mask_list.append(
            filterfunc(read = read, **kwargs_to_filterfunc)
        )
    return mask_list
        
def default_cutfunc(
    read: str,
    fwd_adapter: str,
    rev_adapter: str,
    ) -> str:
    """`fwd_adapter`, `rev_adapter` を持つ read 配列に対して，`fwd_adapter`, `rev_adapter` を切り落とした配列を返却する。`cut_adapters()` においてデフォルトで適用される関数である。
    
    Parameters
    ----------
    read : str
        各塩基が `'ATCGU'` のいずれかで示される `str` 型の単一塩基配列。`fwd_adapter` および `rev_adapter` をそれぞれ 5' 末端，3' 末端に持つことを前提とする。
    fwd_adapter : str
        5' 末端側の固定塩基配列を `'ATCGU'` の `str` で表したもの。
    rev_adapter : str
        3' 末端側の固定塩基配列を `'ATCGU'` の `str` で表したもの。
    
    Returns
    -------
    adapter_removed_read : str
        両末端の固定塩基配列を除去した `read` 配列。
    """
    read = deepcopy(read)
    fwd_adapter_length = len(fwd_adapter)
    rev_adapter_length = len(rev_adapter)
    if rev_adapter_length != 0:
        adapter_removed_read = read[
            fwd_adapter_length : -rev_adapter_length
        ]
    else:
        adapter_removed_read = read[
            fwd_adapter_length :
        ]
    return adapter_removed_read

def cut_adapters(
    reads : List[str],
    kwargs_to_cutfunc : dict,
    cutfunc : Callable[..., str] = default_cutfunc,
    ) -> List[str]:
    """`raw_reads` で示される HT-SELEX データの各配列を引数に入れて `cutfunc` が両端固定配列の除去を行う。固定配列を除去した `raw_reads` が返却される。
    
    Parameters
    ----------
    raw_reads : List[str]
        各塩基が `'ATCGU'` のいずれかで示される `str` 型の塩基配列表現を list にした HT-SELEX データ。
    cutfunc : Callable[[str, ...], str], default = default_cutfunc
        各 read 配列を引数にとって両端固定配列の除去を実際に行う関数。各 read 配列は各塩基が `'ATCGU'` のいずれかで示される `str` 型の単一塩基配列でなければならず，`cutfunc` 関数内では `read: str` と名付けられた引数名によって参照されなければならない。
    kwargs_to_cutfunc : dict
        `cutfunc` に引き渡されるキーワード引数とその値をまとめたディクショナリ。
    
    Returns
    -------
    adapter_removed_reads : List[str]
        `reads` 内の各配列に対して，`cutfunc` で両端固定配列を除去した配列の list。
    """
    adapter_removed_reads = list()
    for read in reads:
        adapter_removed_reads.append(
            cutfunc(read = read, **kwargs_to_cutfunc)
        )
    return adapter_removed_reads

def unify_duplicates(
    reads: List[str],
    min_count: int = 1,
    ) -> Tuple[List[str], List[int]]:
    """`reads` 内の塩基配列が重複している read を一つにまとめて，`List[str]` 型で返却する。
    ただし `min_count` に示される最低個数以上重複している配列のみを返却する。デフォルトの場合 `min_count = 1` であるが，この場合はただ重複配列を一つにまとめる (unique 化する）だけである。
    
    Parameters
    ----------
    reads : List[str]
        各塩基が `'ATCGU'` のいずれかで示される `str` 型の塩基配列表現を list にした HT-SELEX データ。
    min_count : int, default = 1
        read 配列を返却する最低重複回数。
    
    Returns
    -------
    unique_reads_with_counts : Tuple[List[str], List[int]]
        タプルの中身は `(unique_reads, counts)` であり，`unique_reads` が重複が一つにまとめられた read の list である。`counts` は `unique_reads` 内の各 read の重複回数である。
    """
    from collections import Counter
    read_count_tuples = list(
        filter(
            lambda read_count: 
            read_count[1] >= min_count, 
            Counter(reads).most_common()
        )
    )
    # pylance の型情報がうまく反映されないので zip の使用は避ける。
    # unique_reads, counts = zip(*read_count_tuples)
    unique_reads = list()
    counts = list()
    for read, count in read_count_tuples:
        unique_reads.append(read)
        counts.append(count)
    unique_reads_with_counts = (unique_reads, counts)
    return unique_reads_with_counts


def read_SELEX_data(
    filepath: str or Path,
    filetype: str,
    is_biopython_format: bool = False
    ) -> pd.DataFrame:
    """fasta ファイル，fastq ファイル形式などで用意した HT-SELEX データの単ラウンド情報を `pandas.DataFrame` にまとめる。

    Parameters
    ----------
    filepath : str or Path
        HT-SELEX の単ラウンド情報を記載したシーケンスデータのパス。
    filetype : str
        `filepath` で提供するシーケンスデータのフォーマットスタイル。スタイル名は [こちら](https://biopython.org/wiki/SeqIO#file-formats) を参照。
    is_biopython_format: bool, default False
        Biopython モジュールの `Bio.Seq.Seq` 型で各塩基配列を格納するかどうかを指定する。デフォルトでは `False` 値であり，組み込みの `str` 型で表現されることとなっている。

    Returns
    -------
    result_df : pandas.DataFrame
        `filepath` に示された HT-SELEX データ内の各 read の情報を `ID`, `Sequence` のカラムでまとめた `DataFrame` を返却する。
    
    Examples
    --------
    >>> df = read_SELEX_data("data/real/A_4R.fastq", "fastq")
    >>> df.head()
                      ID                                           Sequence
    0  E08OS:00004:00015  TAATACGACTCACTATAGGGAGCAGGAGAGAGGTCAGATGACGGGG...
    1  E08OS:00004:00033  TAATACGACTCACTATAGGGAGCAGGAGAGAGGTCAGATGAACAAG...
    2  E08OS:00005:00031  TAATACGACTCACTATAGGGAGCAGGAGAGAGGTCAGATGAACGGA...
    3  E08OS:00006:00033  TAATACGACTCACTATAGGGAGCAGGAGAGAGGTCAGATGTACATT...
    4  E08OS:00006:00037  TAATACGACTCACTATAGGGAGCAGGAGAGAGGTCAGATGTCAGAG...
    >>> df = read_SELEX_data("data/real/A_4R.fastq", "fastq", is_biopython_format = True)
    >>> df.head()
                      ID                                           Sequence
    0  E08OS:00004:00015  (T, A, A, T, A, C, G, A, C, T, C, A, C, T, A, ...
    1  E08OS:00004:00033  (T, A, A, T, A, C, G, A, C, T, C, A, C, T, A, ...
    2  E08OS:00005:00031  (T, A, A, T, A, C, G, A, C, T, C, A, C, T, A, ...
    3  E08OS:00006:00033  (T, A, A, T, A, C, G, A, C, T, C, A, C, T, A, ...
    4  E08OS:00006:00037  (T, A, A, T, A, C, G, A, C, T, C, A, C, T, A, ...
    >>> type(df["Sequence"][0])
    <class 'Bio.Seq.Seq'>
    """
    path = Path(filepath)
    seq_ID_list = list()
    seq_list = list()
    with path.open("r") as handle:
        for record in SeqIO.parse(handle, filetype):
            seq_ID_list.append(record.id)
            if is_biopython_format == True: 
                seq_list.append(record.seq)
            else:
                seq_list.append(str(record.seq))
    result_df = pd.DataFrame({
        'ID': seq_ID_list,
        'Sequence': seq_list,
    })
    return result_df
