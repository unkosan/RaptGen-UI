import { renderHook, act } from '@testing-library/react-hooks';
import { useGraphConfig } from '../use-graph-config';
import { useDispatch, useSelector } from 'react-redux';
import { setGraphConfig } from '../../../redux/graph-config';

// Mock the dependencies
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../redux/graph-config', () => ({
  setGraphConfig: jest.fn(),
}));

describe('useGraphConfig', () => {
  // Setup common mocks
  const mockDispatch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock dispatch
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    
    // Mock selector
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        graphConfig: {
          minCount: 5,
        },
      };
      return selector(state);
    });
    
    // Mock action creator
    (setGraphConfig as unknown as jest.Mock).mockImplementation((payload) => ({
      type: 'SET_GRAPH_CONFIG',
      payload,
    }));
  });
  
  it('should return the correct initial values', () => {
    const { result } = renderHook(() => useGraphConfig());
    
    expect(result.current.minCount).toBe(5);
    expect(result.current.isValidMinCount).toBe(true);
    expect(typeof result.current.handleMinCountChange).toBe('function');
  });
  
  it('should update minCount and validation state when handleMinCountChange is called with valid input', () => {
    const { result } = renderHook(() => useGraphConfig());
    
    // Simulate input change with valid value
    act(() => {
      result.current.handleMinCountChange({
        target: { value: '10' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    // Check state updates
    expect(result.current.minCount).toBe(10);
    expect(result.current.isValidMinCount).toBe(true);
    
    // Check Redux action
    expect(setGraphConfig).toHaveBeenCalledWith({
      minCount: 10,
    });
    
    expect(mockDispatch).toHaveBeenCalled();
  });
  
  it('should update minCount and validation state when handleMinCountChange is called with invalid input', () => {
    const { result } = renderHook(() => useGraphConfig());
    
    // Simulate input change with invalid value (negative number)
    act(() => {
      result.current.handleMinCountChange({
        target: { value: '-5' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    // Check state updates
    expect(result.current.minCount).toBe(-5);
    expect(result.current.isValidMinCount).toBe(false);
    
    // Check Redux action - should use previous valid value
    expect(setGraphConfig).toHaveBeenCalledWith({
      minCount: 5, // Previous valid value from Redux store
    });
    
    expect(mockDispatch).toHaveBeenCalled();
  });
  
  it('should update minCount and validation state when handleMinCountChange is called with non-numeric input', () => {
    const { result } = renderHook(() => useGraphConfig());
    
    // Simulate input change with non-numeric value
    act(() => {
      result.current.handleMinCountChange({
        target: { value: 'abc' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    // Check state updates
    expect(result.current.minCount).toBe(NaN);
    expect(result.current.isValidMinCount).toBe(false);
    
    // Check Redux action - should use previous valid value
    expect(setGraphConfig).toHaveBeenCalledWith({
      minCount: 5, // Previous valid value from Redux store
    });
    
    expect(mockDispatch).toHaveBeenCalled();
  });
  
  it('should update Redux store when minCount changes', () => {
    const { rerender } = renderHook(() => useGraphConfig());
    
    // Check initial Redux action
    expect(setGraphConfig).toHaveBeenCalledWith({
      minCount: 5,
    });
    
    // Update selector mock to simulate Redux store update
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the updated Redux state
      const state = {
        graphConfig: {
          minCount: 10, // Updated value
        },
      };
      return selector(state);
    });
    
    // Rerender to trigger effect
    rerender();
    
    // Check Redux action with updated value
    expect(setGraphConfig).toHaveBeenCalledWith({
      minCount: 5, // Initial value from hook state
    });
  });
});