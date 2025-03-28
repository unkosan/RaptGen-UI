import { renderHook, act } from '@testing-library/react-hooks';
import { usePreprocessingParams, useModelTypeSelection } from '../use-preprocessing-params';
import { useDispatch, useSelector } from 'react-redux';
import { setPreprocessingConfig } from '../../../redux/preprocessing-config';
import { setPageConfig } from '../../../redux/page-config';
import { apiClient } from '~/services/api-client';

// Mock the dependencies
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../redux/preprocessing-config', () => ({
  setPreprocessingConfig: jest.fn(),
}));

jest.mock('../../../redux/page-config', () => ({
  setPageConfig: jest.fn(),
}));

jest.mock('~/services/api-client', () => ({
  apiClient: {
    estimateTargetLength: jest.fn(),
    estimateAdapters: jest.fn(),
  },
}));

describe('usePreprocessingParams', () => {
  // Setup common mocks
  const mockDispatch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock dispatch
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    
    // Mock action creators
    (setPreprocessingConfig as unknown as jest.Mock).mockImplementation((payload) => ({
      type: 'SET_PREPROCESSING_CONFIG',
      payload,
    }));
    
    (setPageConfig as unknown as jest.Mock).mockImplementation((payload) => ({
      type: 'SET_PAGE_CONFIG',
      payload,
    }));
  });
  
  it('should return the correct initial values', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        pageConfig: {
          experimentName: 'Test Experiment',
          modelType: 'RaptGen',
        },
        preprocessingConfig: {
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
        },
        selexData: {
          sequences: ['ACGUUGCA', 'UGCAACGU'],
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => usePreprocessingParams());
    
    // Check returned structure
    expect(result.current.modelType).toBeDefined();
    expect(result.current.experimentName).toBeDefined();
    expect(result.current.targetLength).toBeDefined();
    expect(result.current.adapters).toBeDefined();
    expect(result.current.tolerance).toBeDefined();
    expect(result.current.minCount).toBeDefined();
    expect(result.current.fullSequences).toBeDefined();
    
    // Check initial values
    expect(result.current.modelType.value).toBe('RaptGen');
    expect(result.current.experimentName.value).toBe('Test Experiment');
    expect(result.current.targetLength.value).toBe(30);
    expect(result.current.adapters.forwardAdapter.value).toBe('ACGU');
    expect(result.current.adapters.reverseAdapter.value).toBe('UGCA');
    expect(result.current.tolerance.value).toBe(2);
    expect(result.current.minCount.value).toBe(10);
    expect(result.current.fullSequences).toEqual(['ACGUUGCA', 'UGCAACGU']);
  });
  
  it('should handle experiment name change', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        pageConfig: {
          experimentName: 'Test Experiment',
          modelType: 'RaptGen',
        },
        preprocessingConfig: {
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
        },
        selexData: {
          sequences: ['ACGUUGCA', 'UGCAACGU'],
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => usePreprocessingParams());
    
    // Simulate input change
    act(() => {
      result.current.experimentName.handleChange({
        target: { value: 'New Experiment Name' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    // Check dispatch was called with correct action
    expect(setPageConfig).toHaveBeenCalledWith({
      experimentName: 'New Experiment Name',
      modelType: 'RaptGen',
    });
  });
  
  it('should handle adapter change and convert T to U', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        pageConfig: {
          experimentName: 'Test Experiment',
          modelType: 'RaptGen',
        },
        preprocessingConfig: {
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
        },
        selexData: {
          sequences: ['ACGUUGCA', 'UGCAACGU'],
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => usePreprocessingParams());
    
    // Simulate input change with T that should be converted to U
    act(() => {
      result.current.adapters.forwardAdapter.handleChange({
        target: { value: 'ACGTt' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    // Check dispatch was called with correct action and T converted to U
    expect(setPreprocessingConfig).toHaveBeenCalledWith({
      forwardAdapter: 'ACGUU',
      reverseAdapter: 'UGCA',
      targetLength: 30,
      tolerance: 2,
      minCount: 10,
    });
  });
  
  it('should estimate target length successfully', async () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        pageConfig: {
          experimentName: 'Test Experiment',
          modelType: 'RaptGen',
        },
        preprocessingConfig: {
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
        },
        selexData: {
          sequences: ['ACGUUGCA', 'UGCAACGU'],
        },
      };
      return selector(state);
    });
    
    // Mock API response
    (apiClient.estimateTargetLength as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { target_length: 40 },
    });
    
    const { result } = renderHook(() => usePreprocessingParams());
    
    // Before estimation
    expect(result.current.targetLength.value).toBe(30);
    expect(result.current.targetLength.isEstimating).toBe(false);
    
    // Perform estimation
    await act(async () => {
      await result.current.targetLength.estimate();
    });
    
    // After estimation
    expect(apiClient.estimateTargetLength).toHaveBeenCalledWith({
      sequences: ['ACGUUGCA', 'UGCAACGU'],
    });
    
    expect(setPreprocessingConfig).toHaveBeenCalledWith({
      forwardAdapter: 'ACGU',
      reverseAdapter: 'UGCA',
      targetLength: 40,
      tolerance: 2,
      minCount: 10,
    });
    
    expect(result.current.targetLength.isEstimating).toBe(false);
  });
  
  it('should estimate adapters successfully', async () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        pageConfig: {
          experimentName: 'Test Experiment',
          modelType: 'RaptGen',
        },
        preprocessingConfig: {
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
        },
        selexData: {
          sequences: ['ACGUUGCA', 'UGCAACGU'],
        },
      };
      return selector(state);
    });
    
    // Mock API response
    (apiClient.estimateAdapters as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        forward_adapter: 'GGTT',
        reverse_adapter: 'AACC',
      },
    });
    
    const { result } = renderHook(() => usePreprocessingParams());
    
    // Before estimation
    expect(result.current.adapters.forwardAdapter.value).toBe('ACGU');
    expect(result.current.adapters.reverseAdapter.value).toBe('UGCA');
    expect(result.current.adapters.isEstimating).toBe(false);
    
    // Perform estimation
    await act(async () => {
      await result.current.adapters.estimate();
    });
    
    // After estimation
    expect(apiClient.estimateAdapters).toHaveBeenCalledWith({
      target_length: 30,
      sequences: ['ACGUUGCA', 'UGCAACGU'],
    });
    
    expect(setPreprocessingConfig).toHaveBeenCalledWith({
      forwardAdapter: 'GGUU',
      reverseAdapter: 'AACC',
      targetLength: 30,
      tolerance: 2,
      minCount: 10,
    });
    
    expect(result.current.adapters.isEstimating).toBe(false);
  });
  
  it('should handle API errors during estimation', async () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        pageConfig: {
          experimentName: 'Test Experiment',
          modelType: 'RaptGen',
        },
        preprocessingConfig: {
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
        },
        selexData: {
          sequences: ['ACGUUGCA', 'UGCAACGU'],
        },
      };
      return selector(state);
    });
    
    // Mock API error
    (apiClient.estimateTargetLength as jest.Mock).mockRejectedValue(new Error('API error'));
    
    const { result } = renderHook(() => usePreprocessingParams());
    
    // Perform estimation that will fail
    await act(async () => {
      await result.current.targetLength.estimate();
    });
    
    // Should reset loading state even after error
    expect(result.current.targetLength.isEstimating).toBe(false);
    expect(setPreprocessingConfig).not.toHaveBeenCalled();
  });
});

describe('useModelTypeSelection', () => {
  const mockDispatch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (setPageConfig as unknown as jest.Mock).mockImplementation((payload) => ({
      type: 'SET_PAGE_CONFIG',
      payload,
    }));
  });
  
  it('should return the correct initial values', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        pageConfig: {
          modelType: 'RaptGen',
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => useModelTypeSelection());
    
    expect(result.current.value).toBe('RaptGen');
    expect(result.current.options).toContain('RaptGen');
    expect(typeof result.current.handleChange).toBe('function');
  });
  
  it('should handle model type change', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        pageConfig: {
          experimentName: 'Test Experiment',
          modelType: 'RaptGen',
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => useModelTypeSelection());
    
    // Simulate select change
    act(() => {
      result.current.handleChange({
        target: { value: 'RaptGen' },
      } as React.ChangeEvent<HTMLSelectElement>);
    });
    
    // Check dispatch was called with correct action
    expect(setPageConfig).toHaveBeenCalledWith({
      experimentName: 'Test Experiment',
      modelType: 'RaptGen',
    });
  });
});