import { renderHook, act } from '@testing-library/react';
import { usePreprocessSelexData } from '../use-pagenation';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { preprocessSelexData } from '../../../redux/selex-data';
import { clearPreprocessingDirty } from '../../../redux/preprocessing-config';

// Mock the dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../redux/selex-data', () => ({
  preprocessSelexData: jest.fn(),
}));

jest.mock('../../../redux/preprocessing-config', () => ({
  clearPreprocessingDirty: jest.fn(),
}));

describe('usePreprocessSelexData', () => {
  // Setup common mocks
  const mockPush = jest.fn();
  const mockDispatch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock dispatch
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    
    // Mock successful dispatch for async actions
    mockDispatch.mockImplementation((action) => {
      if (typeof action === 'function') {
        return Promise.resolve();
      }
      return action;
    });
  });
  
  it('should return the correct initial values', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        preprocessingConfig: {
          forwardAdapter: 'ACGT',
          reverseAdapter: 'TGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
          isDirty: false,
          isValidParams: true,
        },
        pageConfig: {
          experimentName: 'Test Experiment',
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => usePreprocessSelexData());
    
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.handleClickNext).toBe('function');
    expect(typeof result.current.handleClickBack).toBe('function');
    expect(result.current.canProceed).toBe(true);
  });
  
  it('should navigate back when handleClickBack is called', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        preprocessingConfig: {
          forwardAdapter: 'ACGT',
          reverseAdapter: 'TGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
          isDirty: false,
          isValidParams: true,
        },
        pageConfig: {
          experimentName: 'Test Experiment',
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => usePreprocessSelexData());
    
    act(() => {
      result.current.handleClickBack();
    });
    
    expect(mockPush).toHaveBeenCalledWith('/trainer');
  });
  
  it('should navigate to next page without preprocessing when isDirty is false', async () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        preprocessingConfig: {
          forwardAdapter: 'ACGT',
          reverseAdapter: 'TGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
          isDirty: false,
          isValidParams: true,
        },
        pageConfig: {
          experimentName: 'Test Experiment',
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => usePreprocessSelexData());
    
    await act(async () => {
      await result.current.handleClickNext();
    });
    
    expect(mockPush).toHaveBeenCalledWith('?page=raptgen');
    expect(mockDispatch).not.toHaveBeenCalled();
  });
  
  it('should preprocess data and navigate to next page when isDirty is true', async () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        preprocessingConfig: {
          forwardAdapter: 'ACGT',
          reverseAdapter: 'TGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
          isDirty: true,
          isValidParams: true,
        },
        pageConfig: {
          experimentName: 'Test Experiment',
        },
      };
      return selector(state);
    });
    
    // Mock the action creators
    (preprocessSelexData as unknown as jest.Mock).mockReturnValue({ type: 'PREPROCESS_SELEX_DATA' });
    (clearPreprocessingDirty as unknown as jest.Mock).mockReturnValue({ type: 'CLEAR_PREPROCESSING_DIRTY' });
    
    const { result } = renderHook(() => usePreprocessSelexData());
    
    await act(async () => {
      await result.current.handleClickNext();
    });
    
    expect(preprocessSelexData).toHaveBeenCalledWith({
      forwardAdapter: 'ACGT',
      reverseAdapter: 'TGCA',
      targetLength: 30,
      tolerance: 2,
      minCount: 10,
    });
    
    expect(clearPreprocessingDirty).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('?page=raptgen');
  });
  
  it('should handle errors during preprocessing', async () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        preprocessingConfig: {
          forwardAdapter: 'ACGT',
          reverseAdapter: 'TGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
          isDirty: true,
          isValidParams: true,
        },
        pageConfig: {
          experimentName: 'Test Experiment',
        },
      };
      return selector(state);
    });
    
    // Mock error in dispatch
    const mockError = new Error('Preprocessing failed');
    mockDispatch.mockRejectedValueOnce(mockError);
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => usePreprocessSelexData());
    
    await act(async () => {
      await result.current.handleClickNext();
    });
    
    expect(console.error).toHaveBeenCalledWith(mockError);
    expect(result.current.isLoading).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });
  
  it('should disable proceeding when params are invalid', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        preprocessingConfig: {
          forwardAdapter: 'ACGT',
          reverseAdapter: 'TGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
          isDirty: false,
          isValidParams: false,
        },
        pageConfig: {
          experimentName: 'Test Experiment',
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => usePreprocessSelexData());
    
    expect(result.current.canProceed).toBe(false);
  });
  
  it('should disable proceeding when experiment name is missing', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        preprocessingConfig: {
          forwardAdapter: 'ACGT',
          reverseAdapter: 'TGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
          isDirty: false,
          isValidParams: true,
        },
        pageConfig: {
          experimentName: '',
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => usePreprocessSelexData());
    
    expect(result.current.canProceed).toBe(false);
  });
});