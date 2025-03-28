import { renderHook, act } from '@testing-library/react';
import { useChildJobCard } from '../use-child-job-card';
import { intervalToDuration } from 'date-fns';

// Mock date-fns
jest.mock('date-fns', () => ({
  intervalToDuration: jest.fn(),
}));

describe('useChildJobCard', () => {
  // Mock console.log
  const originalConsoleLog = console.log;
  const mockConsoleLog = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    
    // Mock intervalToDuration
    (intervalToDuration as jest.Mock).mockImplementation(({ start, end }) => {
      const duration = end - start;
      const seconds = Math.floor((duration / 1000) % 60);
      const minutes = Math.floor((duration / (1000 * 60)) % 60);
      const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
      const days = Math.floor(duration / (1000 * 60 * 60 * 24));
      
      return { days, hours, minutes, seconds };
    });
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
  });
  
  it('should return the correct utility functions', () => {
    const { result } = renderHook(() => useChildJobCard({}));
    
    expect(typeof result.current.formatDurationText).toBe('function');
    expect(typeof result.current.handleClick).toBe('function');
    expect(typeof result.current.getCardStyle).toBe('function');
  });
  
  describe('formatDurationText', () => {
    it('should return empty string for non-progress status', () => {
      const { result } = renderHook(() => useChildJobCard({}));
      
      expect(result.current.formatDurationText('success', 1000)).toBe('');
      expect(result.current.formatDurationText('failure', 1000)).toBe('');
      expect(result.current.formatDurationText('pending', 1000)).toBe('');
      expect(result.current.formatDurationText('suspend', 1000)).toBe('');
    });
    
    it('should return empty string if duration is not provided', () => {
      const { result } = renderHook(() => useChildJobCard({}));
      
      expect(result.current.formatDurationText('progress')).toBe('');
      expect(result.current.formatDurationText('progress', undefined)).toBe('');
    });
    
    it('should format duration with seconds only', () => {
      const { result } = renderHook(() => useChildJobCard({}));
      
      // Mock 30 seconds
      (intervalToDuration as jest.Mock).mockReturnValueOnce({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 30,
      });
      
      expect(result.current.formatDurationText('progress', 30000)).toBe('Running for 30s');
    });
    
    it('should format duration with minutes and seconds', () => {
      const { result } = renderHook(() => useChildJobCard({}));
      
      // Mock 2 minutes and 30 seconds
      (intervalToDuration as jest.Mock).mockReturnValueOnce({
        days: 0,
        hours: 0,
        minutes: 2,
        seconds: 30,
      });
      
      expect(result.current.formatDurationText('progress', 150000)).toBe('Running for 2m 30s');
    });
    
    it('should format duration with hours, minutes, and seconds', () => {
      const { result } = renderHook(() => useChildJobCard({}));
      
      // Mock 1 hour, 2 minutes, and 30 seconds
      (intervalToDuration as jest.Mock).mockReturnValueOnce({
        days: 0,
        hours: 1,
        minutes: 2,
        seconds: 30,
      });
      
      expect(result.current.formatDurationText('progress', 3750000)).toBe('Running for 1h 2m 30s');
    });
    
    it('should convert days to hours', () => {
      const { result } = renderHook(() => useChildJobCard({}));
      
      // Mock 2 days, 3 hours, 2 minutes, and 30 seconds
      (intervalToDuration as jest.Mock).mockReturnValueOnce({
        days: 2,
        hours: 3,
        minutes: 2,
        seconds: 30,
      });
      
      // 2 days * 24 + 3 hours = 51 hours
      expect(result.current.formatDurationText('progress', 176550000)).toBe('Running for 51h 2m 30s');
    });
  });
  
  describe('handleClick', () => {
    it('should call the provided onClick handler', () => {
      const mockOnClick = jest.fn();
      const { result } = renderHook(() => useChildJobCard({ onClick: mockOnClick }));
      
      const mockEvent = {} as React.MouseEvent<HTMLElement, MouseEvent>;
      
      act(() => {
        result.current.handleClick(mockEvent);
      });
      
      expect(mockOnClick).toHaveBeenCalledWith(mockEvent);
    });
    
    it('should log a message if event or onClick is undefined', () => {
      const { result } = renderHook(() => useChildJobCard({}));
      
      const mockEvent = {} as React.MouseEvent<HTMLElement, MouseEvent>;
      
      act(() => {
        result.current.handleClick(mockEvent);
      });
      
      expect(mockConsoleLog).toHaveBeenCalledWith('event or onClick is undefined');
    });
  });
  
  describe('getCardStyle', () => {
    it('should return the correct style for selected state', () => {
      const { result } = renderHook(() => useChildJobCard({}));
      
      const style = result.current.getCardStyle(true);
      
      expect(style.backgroundColor).toBe('#f0f0f0');
      expect(style.border).toBe('1px solid gray');
      expect(style.cursor).toBe('pointer');
    });
    
    it('should return the correct style for unselected state', () => {
      const { result } = renderHook(() => useChildJobCard({}));
      
      const style = result.current.getCardStyle(false);
      
      expect(style.backgroundColor).toBe('#f5f5f5');
      expect(style.border).toBe('1px solid lightgray');
      expect(style.cursor).toBe('pointer');
    });
  });
});