import { renderHook, act } from '@testing-library/react-hooks';
import { useVaeJobs } from '../use-vae-jobs';
import { useRouter } from 'next/router';
import { apiClient } from '~/services/api-client';

// Mock the dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('~/services/api-client', () => ({
  apiClient: {
    postSearchJobs: jest.fn(),
  },
}));

describe('useVaeJobs', () => {
  // Mock data
  const mockJobs = [
    {
      uuid: 'job-1',
      name: 'Job 1',
      status: 'progress',
      series: [
        {
          item_id: 1,
          item_status: 'progress',
          item_datetime_start: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          item_duration_suspend: 0,
          item_datetime_laststop: null,
          item_epochs_current: 50,
          item_epochs_total: 100,
        },
      ],
    },
    {
      uuid: 'job-2',
      name: 'Job 2',
      status: 'success',
      series: [
        {
          item_id: 2,
          item_status: 'success',
          item_datetime_start: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
          item_duration_suspend: 0,
          item_datetime_laststop: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          item_epochs_current: 100,
          item_epochs_total: 100,
        },
      ],
    },
  ];
  
  // Mock router
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      query: { experiment: 'job-1' },
      push: mockPush,
    });
    
    // Mock API response
    (apiClient.postSearchJobs as jest.Mock).mockResolvedValue(mockJobs);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('should fetch jobs on mount and set up interval', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useVaeJobs());
    
    // Initial state
    expect(result.current.runningJobs).toEqual([]);
    expect(result.current.finishedJobs).toEqual([]);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.experimentId).toBe('job-1');
    
    // Wait for API call to resolve
    await waitForNextUpdate();
    
    // Check API call
    expect(apiClient.postSearchJobs).toHaveBeenCalledWith({
      search_regex: undefined,
    });
    
    // Check state after API call
    expect(result.current.runningJobs).toHaveLength(1);
    expect(result.current.runningJobs[0].uuid).toBe('job-1');
    expect(result.current.finishedJobs).toHaveLength(1);
    expect(result.current.finishedJobs[0].uuid).toBe('job-2');
    
    // Advance timer to trigger interval
    jest.advanceTimersByTime(5000);
    
    // Check that API was called again
    expect(apiClient.postSearchJobs).toHaveBeenCalledTimes(2);
  });
  
  it('should update jobs when searchQuery changes', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useVaeJobs());
    
    // Wait for initial API call to resolve
    await waitForNextUpdate();
    
    // Update search query
    act(() => {
      result.current.setSearchQuery('test');
    });
    
    // Check API call with search query
    expect(apiClient.postSearchJobs).toHaveBeenCalledWith({
      search_regex: 'test',
    });
  });
  
  it('should navigate to job page when handleJobClick is called', () => {
    const { result } = renderHook(() => useVaeJobs());
    
    act(() => {
      result.current.handleJobClick('job-3');
    });
    
    expect(mockPush).toHaveBeenCalledWith('?experiment=job-3', undefined, {
      scroll: false,
    });
  });
  
  it('should navigate to child job page when handleChildJobClick is called', () => {
    const { result } = renderHook(() => useVaeJobs());
    
    act(() => {
      result.current.handleChildJobClick('job-3', 4);
    });
    
    expect(mockPush).toHaveBeenCalledWith('?experiment=job-3&job=4', undefined, {
      scroll: false,
    });
  });
  
  describe('calculateRunningSeriesItem', () => {
    it('should calculate series item for progress status', () => {
      const { result } = renderHook(() => useVaeJobs());
      
      const now = Date.now();
      const oneHourAgo = Math.floor(now / 1000) - 3600; // 1 hour ago
      
      const childJob = {
        item_id: 1,
        item_status: 'progress' as const,
        item_datetime_start: oneHourAgo,
        item_duration_suspend: 0,
        item_datetime_laststop: null,
        item_epochs_current: 50,
        item_epochs_total: 100,
      };
      
      const seriesItem = result.current.calculateRunningSeriesItem(childJob);
      
      expect(seriesItem.id).toBe(1);
      expect(seriesItem.status).toBe('progress');
      expect(seriesItem.epochsCurrent).toBe(50);
      expect(seriesItem.epochsTotal).toBe(100);
      
      // Duration should be approximately 1 hour (3600000 ms)
      expect(seriesItem.duration).toBeCloseTo(3_600_000, -4);
    });
    
    it('should calculate series item for pending status', () => {
      const { result } = renderHook(() => useVaeJobs());
      
      const childJob = {
        item_id: 1,
        item_status: 'pending' as const,
        item_datetime_start: Math.floor(Date.now() / 1000) - 3600,
        item_duration_suspend: 0,
        item_datetime_laststop: null,
        item_epochs_current: 0,
        item_epochs_total: 100,
      };
      
      const seriesItem = result.current.calculateRunningSeriesItem(childJob);
      
      expect(seriesItem.id).toBe(1);
      expect(seriesItem.status).toBe('pending');
      expect(seriesItem.duration).toBe(0);
      expect(seriesItem.epochsCurrent).toBe(0);
      expect(seriesItem.epochsTotal).toBe(100);
    });
    
    it('should calculate series item for suspend status', () => {
      const { result } = renderHook(() => useVaeJobs());
      
      const now = Date.now();
      const twoHoursAgo = Math.floor(now / 1000) - 7200; // 2 hours ago
      const oneHourAgo = Math.floor(now / 1000) - 3600; // 1 hour ago
      
      const childJob = {
        item_id: 1,
        item_status: 'suspend' as const,
        item_datetime_start: twoHoursAgo,
        item_duration_suspend: 0,
        item_datetime_laststop: oneHourAgo,
        item_epochs_current: 50,
        item_epochs_total: 100,
      };
      
      const seriesItem = result.current.calculateRunningSeriesItem(childJob);
      
      expect(seriesItem.id).toBe(1);
      expect(seriesItem.status).toBe('suspend');
      expect(seriesItem.epochsCurrent).toBe(50);
      expect(seriesItem.epochsTotal).toBe(100);
      
      // Duration should be approximately 1 hour (3600 ms)
      expect(seriesItem.duration).toBeCloseTo(3_600_000, -4); 
    });
  });
  
  describe('calculateFinishedSeriesItem', () => {
    it('should calculate series item with item_datetime_laststop', () => {
      const { result } = renderHook(() => useVaeJobs());
      
      const now = Date.now();
      const twoHoursAgo = Math.floor(now / 1000) - 7200; // 2 hours ago
      const oneHourAgo = Math.floor(now / 1000) - 3600; // 1 hour ago
      
      const childJob = {
        item_id: 2,
        item_status: 'success' as const,
        item_datetime_start: twoHoursAgo,
        item_duration_suspend: 0,
        item_datetime_laststop: oneHourAgo,
        item_epochs_current: 100,
        item_epochs_total: 100,
      };
      
      const seriesItem = result.current.calculateFinishedSeriesItem(childJob);
      
      expect(seriesItem.id).toBe(2);
      expect(seriesItem.status).toBe('success');
      expect(seriesItem.duration).toBeCloseTo(3_600_000, -4);
      expect(seriesItem.epochsCurrent).toBe(100);
      expect(seriesItem.epochsTotal).toBe(100);
    });
  });
});