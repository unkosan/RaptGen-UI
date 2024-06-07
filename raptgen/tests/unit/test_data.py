import torch
import numpy as np
from Bio.SeqRecord import SeqRecord
import pytest
import os

# internal package
from core.preprocessing import one_hot_encode, ID_encode


def test_one_hot_index():
    """Test one_hot_index function."""
    # Test case 1
    seq = "ATGC"
    expected_output = [0, 1, 2, 3]
    assert ID_encode(seq) == expected_output

    # Test case 2
    seq = "CTAG"
    expected_output = [3, 1, 0, 2]
    assert ID_encode(seq) == expected_output

    # Test case 3
    seq = "AGCT"
    expected_output = [0, 2, 3, 1]
    assert ID_encode(seq) == expected_output


def test_one_hot_encode():
    """Test one_hot_encode function."""
    # Test case 1
    seq = "ATGC"
    expected_output = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])
    assert np.array_equal(one_hot_encode(seq), expected_output)

    # Test case 2
    seq = "CTAG"
    expected_output = np.array([[0, 0, 0, 1], [0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0]])
    assert np.array_equal(one_hot_encode(seq), expected_output)

    # Test case 3
    seq = "AGCT"
    expected_output = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [0, 1, 0, 0]])
    assert np.array_equal(one_hot_encode(seq), expected_output)

    # Test case 4
    seq = "ATGC"
    padding = 2  # same on left and right
    expected_output = np.array(
        [
            [0.25, 0.25, 0.25, 0.25],
            [0.25, 0.25, 0.25, 0.25],
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
            [0.25, 0.25, 0.25, 0.25],
            [0.25, 0.25, 0.25, 0.25],
        ]
    )
    assert np.array_equal(
        one_hot_encode(
            seq, padding, padding, padding_template=np.array([0.25, 0.25, 0.25, 0.25])
        ),
        expected_output,
    )

    # Test case 5
    seq = "AGCT"
    left_padding = 2
    right_padding = 3
    expected_output = np.array(
        [
            [0.25, 0.25, 0.25, 0.25],
            [0.25, 0.25, 0.25, 0.25],
            [1, 0, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
            [0, 1, 0, 0],
            [0.25, 0.25, 0.25, 0.25],
            [0.25, 0.25, 0.25, 0.25],
            [0.25, 0.25, 0.25, 0.25],
        ]
    )
    assert np.array_equal(
        one_hot_encode(
            seq,
            left_padding,
            right_padding,
            padding_template=np.array([0.25, 0.25, 0.25, 0.25]),
        ),
        expected_output,
    )

    # Test case 6
    seq = "AGCT"
    left_padding = 3
    right_padding = 2
    expected_output = np.array(
        [
            [0.25, 0.25, 0.25, 0.25],
            [0.25, 0.25, 0.25, 0.25],
            [0.25, 0.25, 0.25, 0.25],
            [1, 0, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
            [0, 1, 0, 0],
            [0.25, 0.25, 0.25, 0.25],
            [0.25, 0.25, 0.25, 0.25],
        ]
    )
    assert np.array_equal(
        one_hot_encode(
            seq,
            left_padding,
            right_padding,
            padding_template=np.array([0.25, 0.25, 0.25, 0.25]),
        ),
        expected_output,
    )
