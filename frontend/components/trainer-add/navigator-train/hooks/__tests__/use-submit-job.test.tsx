import { renderHook, act } from '@testing-library/react-hooks';
import { useSubmitJob } from '../use-submit-job';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { apiClient } from '~/services/api-client';

// Mock the dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('~/services/api-client', () => ({
  apiClient: {
    postSubmitJob: jest.fn(),
  },
}));

describe('useSubmitJob', () => {
  // Setup common mocks
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });
  
  it('should return the correct initial values', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          modelLength: 64,
          epochs: 100,
          forceMatchEpochs: 10,
          betaScheduleEpochs: 20,
          earlyStoppingEpochs: 5,
          seed: 42,
          matchCost: 1.0,
          device: 'cuda',
          reiteration: 1,
          isValidParams: true,
        },
        preprocessingConfig: {
          forwardAdapter: 'ACGT',
          reverseAdapter: 'TGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
        },
        selexData: {
          filteredRandomRegions: ['ACGT', 'TGCA'],
          filteredDuplicates: [1, 2],
        },
        pageConfig: {
          experimentName: 'Test Experiment',
          modelType: 'vae',
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => useSubmitJob());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.canTrain).toBe(true);
    expect(typeof result.current.handleClickTrain).toBe('function');
    expect(typeof result.current.handleClickBack).toBe('function');
  });
  
  it('should navigate back when handleClickBack is called', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          isValidParams: true,
        },
        preprocessingConfig: {},
        selexData: {},
        pageConfig: {},
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => useSubmitJob());
    
    act(() => {
      result.current.handleClickBack();
    });
    
    expect(mockPush).toHaveBeenCalledWith('');
  });
  
  it('should submit job and navigate to job page when handleClickTrain is called', async () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          modelLength: 64,
          epochs: 100,
          forceMatchEpochs: 10,
          betaScheduleEpochs: 20,
          earlyStoppingEpochs: 5,
          seed: 42,
          matchCost: 1.0,
          device: 'cuda',
          reiteration: 1,
          isValidParams: true,
        },
        preprocessingConfig: {
          forwardAdapter: 'ACGT',
          reverseAdapter: 'TGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
        },
        selexData: {
          filteredRandomRegions: ['ACGT', 'TGCA'],
          filteredDuplicates: [1, 2],
        },
        pageConfig: {
          experimentName: 'Test Experiment',
          modelType: 'vae',
        },
      };
      return selector(state);
    });
    
    // Mock API response
    (apiClient.postSubmitJob as jest.Mock).mockResolvedValue({ uuid: '123-456-789' });
    
    const { result } = renderHook(() => useSubmitJob());
    
    await act(async () => {
      await result.current.handleClickTrain();
    });
    
    // Check API call
    expect(apiClient.postSubmitJob).toHaveBeenCalledWith({
      type: 'vae',
      name: 'Test Experiment',
      params_preprocessing: {
        forward: 'ACGT',
        reverse: 'TGCA',
        random_region_length: 22, // 30 - 4 - 4
        tolerance: 2,
        minimum_count: 10,
      },
      random_regions: ['ACGT', 'TGCA'],
      duplicates: [1, 2],
      reiteration: 1,
      params_training: {
        model_length: 64,
        epochs: 100,
        match_forcing_duration: 10,
        beta_duration: 20,
        early_stopping: 5,
        seed_value: 42,
        match_cost: 1.0,
        device: 'cuda',
      },
    });
    
    // Check navigation
    expect(mockPush).toHaveBeenCalledWith('/trainer?experiment=123-456-789');
  });
  
  it('should handle API errors when submitting job', async () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          modelLength: 64,
          epochs: 100,
          forceMatchEpochs: 10,
          betaScheduleEpochs: 20,
          earlyStoppingEpochs: 5,
          seed: 42,
          matchCost: 1.0,
          device: 'cuda',
          reiteration: 1,
          isValidParams: true,
        },
        preprocessingConfig: {
          forwardAdapter: 'ACGT',
          reverseAdapter: 'TGCA',
          targetLength: 30,
          tolerance: 2,
          minCount: 10,
        },
        selexData: {
          filteredRandomRegions: ['ACGT', 'TGCA'],
          filteredDuplicates: [1, 2],
        },
        pageConfig: {
          experimentName: 'Test Experiment',
          modelType: 'vae',
        },
      };
      return selector(state);
    });
    
    // Mock API error
    const mockError = new Error('API error');
    (apiClient.postSubmitJob as jest.Mock).mockRejectedValue(mockError);
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useSubmitJob());
    
    await act(async () => {
      await result.current.handleClickTrain();
    });
    
    // Check error handling
    expect(console.error).toHaveBeenCalledWith(mockError);
    expect(result.current.isLoading).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });
  
  it('should disable training when params are invalid', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          isValidParams: false,
        },
        preprocessingConfig: {},
        selexData: {},
        pageConfig: {},
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => useSubmitJob());
    
    expect(result.current.canTrain).toBe(false);
  });
});