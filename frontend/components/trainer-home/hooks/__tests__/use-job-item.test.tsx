import { renderHook, act, waitFor } from '@testing-library/react';
import { useJobItem } from '../use-job-item';
import { useRouter } from 'next/router';
import { apiClient } from '~/services/api-client';
import _ from 'lodash';

// Mock the dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('~/services/api-client', () => ({
  apiClient: {
    getItem: jest.fn(),
    getChildItem: jest.fn(),
  },
}));

// Mock lodash min function
jest.mock('lodash', () => ({
  min: jest.fn(),
}));

describe('useJobItem', () => {
  // Setup common mocks
  const mockParentItem = {
    uuid: 'parent-123',
    status: 'success',
    summary: {
      statuses: ['pending', 'progress', 'success'],
      indices: [0, 1, 2],
      minimum_NLLs: [5.0, 3.0, 4.0],
    },
  };
  
  const mockChildItem = {
    id: 1,
    parent_uuid: 'parent-123',
    status: 'success',
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: {
        experiment: 'parent-123',
        job: '1',
      },
    });
    
    // Mock API responses
    (apiClient.getItem as jest.Mock).mockResolvedValue(mockParentItem);
    (apiClient.getChildItem as jest.Mock).mockResolvedValue(mockChildItem);
    
    // Mock lodash min
    (_.min as jest.Mock).mockReturnValue(3.0);
  });
  
  it('should fetch parent and child items on mount', async () => {
    const { result } = renderHook(() => useJobItem());
    
    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.pid).toBe('parent-123');
    expect(result.current.cid).toBe('1');
    expect(result.current.pItem).toBeNull();
    expect(result.current.cItem).toBeNull();
    
    // Wait for parent fetch to complete
    await waitFor(() => {
      expect(apiClient.getItem).toHaveBeenCalledWith({
        params: { parent_uuid: 'parent-123' },
      });
    });
    
    // Wait for child fetch to complete
    await waitFor(() => {
      expect(apiClient.getChildItem).toHaveBeenCalledWith({
        params: {
          parent_uuid: 'parent-123',
          child_id: 1,
        },
      });
    });
    
    // Wait for final state
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.pItem).toEqual(mockParentItem);
      expect(result.current.cItem).toEqual(mockChildItem);
    });
  });
  
  it('should not fetch data if router is not ready', async () => {
    // Mock router not ready
    (useRouter as jest.Mock).mockReturnValue({
      isReady: false,
      query: {},
    });
    
    renderHook(() => useJobItem());
    
    // Wait a bit to ensure any potential API calls would have happened
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // API should not be called
    expect(apiClient.getItem).not.toHaveBeenCalled();
    expect(apiClient.getChildItem).not.toHaveBeenCalled();
  });
  
  it('should not fetch data if pid is missing', async () => {
    // Mock router with missing pid
    (useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: {},
    });
    
    renderHook(() => useJobItem());
    
    // Wait a bit to ensure any potential API calls would have happened
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // API should not be called
    expect(apiClient.getItem).not.toHaveBeenCalled();
    expect(apiClient.getChildItem).not.toHaveBeenCalled();
  });
  
  it('should refresh data when refresh function is called', async () => {
    const { result } = renderHook(() => useJobItem());
    
    // Wait for initial fetches to complete
    await waitFor(() => {
      expect(result.current.pItem).toEqual(mockParentItem);
      expect(result.current.cItem).toEqual(mockChildItem);
    });
    
    // Clear mocks to check if they're called again
    jest.clearAllMocks();
    
    // Call refresh function
    act(() => {
      result.current.refresh();
    });
    
    // Wait for refreshed fetches
    await waitFor(() => {
      expect(apiClient.getItem).toHaveBeenCalledWith({
        params: { parent_uuid: 'parent-123' },
      });
    });
    
    await waitFor(() => {
      expect(apiClient.getChildItem).toHaveBeenCalledWith({
        params: {
          parent_uuid: 'parent-123',
          child_id: 1,
        },
      });
    });
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    const mockError = new Error('API error');
    (apiClient.getItem as jest.Mock).mockRejectedValue(mockError);
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useJobItem());
    
    // Wait for API call to fail
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(mockError);
    });
    
    // Should reset loading state
    expect(result.current.isLoading).toBe(false);
    
    // Should not have set items
    expect(result.current.pItem).toBeNull();
    expect(result.current.cItem).toBeNull();
  });
  
  it('should calculate default child ID for success status based on minimum NLL', async () => {
    // Mock parent item with success status
    const successParentItem = {
      ...mockParentItem,
      status: 'success',
      summary: {
        statuses: ['pending', 'progress', 'success'],
        indices: [0, 1, 2],
        minimum_NLLs: [5.0, 3.0, 4.0], // Minimum is at index 1
      },
    };
    
    (apiClient.getItem as jest.Mock).mockResolvedValue(successParentItem);
    
    // Mock router without child ID
    (useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: {
        experiment: 'parent-123',
      },
    });
    
    renderHook(() => useJobItem());
    
    // Wait for parent and child fetches to complete
    await waitFor(() => {
      expect(apiClient.getChildItem).toHaveBeenCalledWith({
        params: {
          parent_uuid: 'parent-123',
          child_id: 1, // Index with minimum NLL
        },
      });
    });
  });
  
  it('should calculate default child ID for progress status based on first occurrence', async () => {
    // Mock parent item with progress status
    const progressParentItem = {
      ...mockParentItem,
      status: 'progress',
      summary: {
        statuses: ['pending', 'progress', 'success'],
        indices: [0, 1, 2],
        minimum_NLLs: [5.0, 3.0, 4.0],
      },
    };
    
    (apiClient.getItem as jest.Mock).mockResolvedValue(progressParentItem);
    
    // Mock router without child ID
    (useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: {
        experiment: 'parent-123',
      },
    });
    
    renderHook(() => useJobItem());
    
    // Wait for parent and child fetches to complete
    await waitFor(() => {
      expect(apiClient.getChildItem).toHaveBeenCalledWith({
        params: {
          parent_uuid: 'parent-123',
          child_id: 1, // Index of first 'progress' status
        },
      });
    });
  });
  
  it('should handle NaN values in minimum_NLLs', async () => {
    // Mock parent item with NaN values
    const nanParentItem = {
      ...mockParentItem,
      status: 'success',
      summary: {
        statuses: ['pending', 'progress', 'success'],
        indices: [0, 1, 2],
        minimum_NLLs: [NaN, 3.0, NaN], // Only index 1 is valid
      },
    };
    
    (apiClient.getItem as jest.Mock).mockResolvedValue(nanParentItem);
    
    // Mock router without child ID
    (useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: {
        experiment: 'parent-123',
      },
    });
    
    renderHook(() => useJobItem());
    
    // Wait for parent and child fetches to complete
    await waitFor(() => {
      expect(apiClient.getChildItem).toHaveBeenCalledWith({
        params: {
          parent_uuid: 'parent-123',
          child_id: 1, // Index with valid NLL
        },
      });
    });
  });
  
  it('should default to child ID 0 if no valid indices are found', async () => {
    // Mock parent item with no valid indices
    const invalidParentItem = {
      ...mockParentItem,
      status: 'unknown', // Unknown status
      summary: {
        statuses: ['pending', 'progress', 'success'],
        indices: [0, 1, 2],
        minimum_NLLs: [5.0, 3.0, 4.0],
      },
    };
    
    (apiClient.getItem as jest.Mock).mockResolvedValue(invalidParentItem);
    
    // Mock router without child ID
    (useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: {
        experiment: 'parent-123',
      },
    });
    
    renderHook(() => useJobItem());
    
    // Wait for parent and child fetches to complete
    await waitFor(() => {
      expect(apiClient.getChildItem).toHaveBeenCalledWith({
        params: {
          parent_uuid: 'parent-123',
          child_id: 0, // Default index
        },
      });
    });
  });
});