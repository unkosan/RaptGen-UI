import { renderHook, act } from '@testing-library/react';
import { useTrainParameters, useDeviceSelection, useModelLengthEffect } from '../use-train-parameters';
import { useDispatch, useSelector } from 'react-redux';
import { setTrainConfig } from '../../../redux/train-config';
import { apiClient } from '~/services/api-client';

// Mock the dependencies
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../redux/train-config', () => ({
  setTrainConfig: jest.fn(),
}));

jest.mock('~/services/api-client', () => ({
  apiClient: {
    getDevices: jest.fn(),
  },
}));

// Mock Math.random for predictable tests
const mockRandom = jest.spyOn(Math, 'random');

describe('useTrainParameters', () => {
  // Setup common mocks
  const mockDispatch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock dispatch
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    
    // Mock action creator
    (setTrainConfig as unknown as jest.Mock).mockImplementation((payload) => ({
      type: 'SET_TRAIN_CONFIG',
      payload,
    }));
    
    // Mock API response
    (apiClient.getDevices as jest.Mock).mockResolvedValue(['cpu', 'cuda']);
  });
  
  it('should return the correct initial values', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          device: 'cpu',
          reiteration: 1,
          seed: 42,
          epochs: 100,
          earlyStoppingEpochs: 5,
          betaScheduleEpochs: 20,
          forceMatchEpochs: 10,
          matchCost: 1.0,
          modelLength: 22,
        },
        preprocessingConfig: {
          isValidParams: true,
          targetLength: 30,
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => useTrainParameters());
    
    // Check returned structure
    expect(result.current.device).toBeDefined();
    expect(result.current.reiteration).toBeDefined();
    expect(result.current.seedValue).toBeDefined();
    expect(result.current.epochs).toBeDefined();
    expect(result.current.earlyStopping).toBeDefined();
    expect(result.current.betaDuration).toBeDefined();
    expect(result.current.matchForcingDuration).toBeDefined();
    expect(result.current.matchCost).toBeDefined();
    expect(result.current.modelLength).toBeDefined();
    
    // Check initial values
    expect(result.current.device.value).toBe('cpu');
    expect(result.current.reiteration.value).toBe(1);
    expect(result.current.seedValue.value).toBe(42);
    expect(result.current.epochs.value).toBe(100);
    expect(result.current.earlyStopping.value).toBe(5);
    expect(result.current.betaDuration.value).toBe(20);
    expect(result.current.matchForcingDuration.value).toBe(10);
    expect(result.current.matchCost.value).toBe(1.0);
    expect(result.current.modelLength.value).toBe(22);
  });
  
  it('should handle numeric parameter changes', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          device: 'cpu',
          reiteration: 1,
          seed: 42,
          epochs: 100,
          earlyStoppingEpochs: 5,
          betaScheduleEpochs: 20,
          forceMatchEpochs: 10,
          matchCost: 1.0,
          modelLength: 22,
        },
        preprocessingConfig: {
          isValidParams: true,
          targetLength: 30,
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => useTrainParameters());
    
    // Simulate input change for epochs
    act(() => {
      result.current.epochs.handleChange({
        target: { value: '200' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    // Check dispatch was called with correct action
    expect(setTrainConfig).toHaveBeenCalledWith({
      device: 'cpu',
      reiteration: 1,
      seed: 42,
      epochs: 200,
      earlyStoppingEpochs: 5,
      betaScheduleEpochs: 20,
      forceMatchEpochs: 10,
      matchCost: 1.0,
      modelLength: 22,
    });
  });
  
  it('should generate random seed value', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          device: 'cpu',
          reiteration: 1,
          seed: 42,
          epochs: 100,
          earlyStoppingEpochs: 5,
          betaScheduleEpochs: 20,
          forceMatchEpochs: 10,
          matchCost: 1.0,
          modelLength: 22,
        },
        preprocessingConfig: {
          isValidParams: true,
          targetLength: 30,
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
        },
      };
      return selector(state);
    });
    
    // Mock random value
    mockRandom.mockReturnValue(0.5);
    
    const { result } = renderHook(() => useTrainParameters());
    
    // Generate random seed
    act(() => {
      result.current.seedValue.generateRandom();
    });
    
    // Expected random value: Math.floor(0.5 * 1000000) = 500000
    expect(setTrainConfig).toHaveBeenCalledWith({
      device: 'cpu',
      reiteration: 1,
      seed: 500000,
      epochs: 100,
      earlyStoppingEpochs: 5,
      betaScheduleEpochs: 20,
      forceMatchEpochs: 10,
      matchCost: 1.0,
      modelLength: 22,
    });
  });
  
  it('should calculate model length based on preprocessing config', () => {
    // First render with initial state
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          device: 'cpu',
          reiteration: 1,
          seed: 42,
          epochs: 100,
          earlyStoppingEpochs: 5,
          betaScheduleEpochs: 20,
          forceMatchEpochs: 10,
          matchCost: 1.0,
          modelLength: 22,
        },
        preprocessingConfig: {
          isValidParams: true,
          targetLength: 30,
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
        },
      };
      return selector(state);
    });
    
    const { result, rerender } = renderHook(() => useTrainParameters());
    
    // Initial model length
    expect(result.current.modelLength.value).toBe(22);
    
    // Update preprocessing config
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the updated Redux state
      const state = {
        trainConfig: {
          device: 'cpu',
          reiteration: 1,
          seed: 42,
          epochs: 100,
          earlyStoppingEpochs: 5,
          betaScheduleEpochs: 20,
          forceMatchEpochs: 10,
          matchCost: 1.0,
          modelLength: 22,
        },
        preprocessingConfig: {
          isValidParams: true,
          targetLength: 40,  // Changed from 30 to 40
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
        },
      };
      return selector(state);
    });
    
    // Rerender to trigger the effect
    rerender();
    
    // Expected model length: 40 - 4 - 4 = 32
    expect(setTrainConfig).toHaveBeenCalledWith({
      device: 'cpu',
      reiteration: 1,
      seed: 42,
      epochs: 100,
      earlyStoppingEpochs: 5,
      betaScheduleEpochs: 20,
      forceMatchEpochs: 10,
      matchCost: 1.0,
      modelLength: 32,
    });
  });
});

describe('useDeviceSelection', () => {
  const mockDispatch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (setTrainConfig as unknown as jest.Mock).mockImplementation((payload) => ({
      type: 'SET_TRAIN_CONFIG',
      payload,
    }));
  });
  
  it('should fetch device list on mount', async () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          device: 'cpu',
        },
      };
      return selector(state);
    });
    
    // Mock API response
    (apiClient.getDevices as jest.Mock).mockResolvedValue(['cpu', 'cuda']);
    
    const { result } = renderHook(() => useDeviceSelection());
    
    // Initial state
    expect(result.current.value).toBe('cpu');
    expect(result.current.options).toEqual(['cpu']);
    
    // Wait for API call to resolve
    await act(async () => {
      // Wait for the effect to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Check updated options
    expect(result.current.options).toEqual(['cpu', 'cuda']);
    expect(apiClient.getDevices).toHaveBeenCalled();
  });
  
  it('should handle device selection change', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          device: 'cpu',
          reiteration: 1,
          seed: 42,
        },
      };
      return selector(state);
    });
    
    const { result } = renderHook(() => useDeviceSelection());
    
    // Simulate select change
    act(() => {
      result.current.handleChange({
        target: { value: 'cuda' },
      } as React.ChangeEvent<HTMLSelectElement>);
    });
    
    // Check dispatch was called with correct action
    expect(setTrainConfig).toHaveBeenCalledWith({
      device: 'cuda',
      reiteration: 1,
      seed: 42,
    });
  });
});

describe('useModelLengthEffect', () => {
  const mockDispatch = jest.fn();
  const mockSetValue = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (setTrainConfig as unknown as jest.Mock).mockImplementation((payload) => ({
      type: 'SET_TRAIN_CONFIG',
      payload,
    }));
  });
  
  it('should calculate model length when preprocessing config is valid', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          modelLength: 22,
        },
        preprocessingConfig: {
          isValidParams: true,
          targetLength: 30,
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
        },
      };
      return selector(state);
    });
    
    // Mock model length parameter
    const modelLength = {
      value: 22,
      setValue: mockSetValue,
      isValid: true,
      handleChange: jest.fn(),
    };
    
    renderHook(() => useModelLengthEffect(modelLength));
    
    // Check model length calculation
    expect(mockSetValue).toHaveBeenCalledWith(22); // 30 - 4 - 4
    expect(setTrainConfig).toHaveBeenCalledWith({
      modelLength: 22,
    });
  });
  
  it('should not calculate model length when preprocessing config is invalid', () => {
    // Mock selector values
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        trainConfig: {
          modelLength: 22,
        },
        preprocessingConfig: {
          isValidParams: false,
          targetLength: 30,
          forwardAdapter: 'ACGU',
          reverseAdapter: 'UGCA',
        },
      };
      return selector(state);
    });
    
    // Mock model length parameter
    const modelLength = {
      value: 22,
      setValue: mockSetValue,
      isValid: true,
      handleChange: jest.fn(),
    };
    
    renderHook(() => useModelLengthEffect(modelLength));
    
    // Should not update model length
    expect(mockSetValue).not.toHaveBeenCalled();
    expect(setTrainConfig).not.toHaveBeenCalled();
  });
});