import { renderHook, act } from '@testing-library/react-hooks';
import { useJobCard } from '../use-job-card';

describe('useJobCard', () => {
  // Mock console.log
  const originalConsoleLog = console.log;
  const mockConsoleLog = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
  });
  
  it('should return the correct initial values', () => {
    const { result } = renderHook(() => useJobCard({}));
    
    expect(result.current.clickedModel).toBeNull();
    expect(typeof result.current.setClickedModel).toBe('function');
    expect(typeof result.current.handleClick).toBe('function');
    expect(typeof result.current.handleChildClick).toBe('function');
    expect(typeof result.current.getCardStyle).toBe('function');
  });
  
  describe('handleClick', () => {
    it('should call the provided onClick handler and reset clickedModel', () => {
      const mockOnClick = jest.fn();
      const { result } = renderHook(() => useJobCard({ onClick: mockOnClick }));
      
      // Set initial clickedModel
      act(() => {
        result.current.setClickedModel(5);
      });
      
      expect(result.current.clickedModel).toBe(5);
      
      // Call handleClick
      const mockEvent = {} as React.MouseEvent<HTMLElement, MouseEvent>;
      
      act(() => {
        result.current.handleClick(mockEvent);
      });
      
      expect(mockOnClick).toHaveBeenCalledWith(mockEvent);
      expect(result.current.clickedModel).toBeNull();
    });
    
    it('should do nothing if onClick is not provided', () => {
      const { result } = renderHook(() => useJobCard({}));
      
      // Set initial clickedModel
      act(() => {
        result.current.setClickedModel(5);
      });
      
      // Call handleClick
      const mockEvent = {} as React.MouseEvent<HTMLElement, MouseEvent>;
      
      act(() => {
        result.current.handleClick(mockEvent);
      });
      
      // clickedModel should remain unchanged
      expect(result.current.clickedModel).toBe(5);
    });
  });
  
  describe('handleChildClick', () => {
    it('should call the provided onChildClick handler and set clickedModel', () => {
      const mockOnChildClick = jest.fn();
      const { result } = renderHook(() => useJobCard({ onChildClick: mockOnChildClick }));
      
      // Call handleChildClick
      const mockEvent = {
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent<HTMLElement, MouseEvent>;
      
      act(() => {
        result.current.handleChildClick(3, mockEvent);
      });
      
      expect(mockOnChildClick).toHaveBeenCalledWith(3, mockEvent);
      expect(result.current.clickedModel).toBe(3);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
    
    it('should set clickedModel even if onChildClick is not provided', () => {
      const { result } = renderHook(() => useJobCard({}));
      
      // Call handleChildClick
      const mockEvent = {
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent<HTMLElement, MouseEvent>;
      
      act(() => {
        result.current.handleChildClick(3, mockEvent);
      });
      
      expect(result.current.clickedModel).toBe(3);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });
  
  describe('getCardStyle', () => {
    it('should return the correct style for selected state with no clicked model', () => {
      const { result } = renderHook(() => useJobCard({}));
      
      const style = result.current.getCardStyle(true, null);
      
      expect(style.backgroundColor).toBe('lightgray');
      expect(style.border).toBe('1px solid gray');
      expect(style.cursor).toBe('pointer');
    });
    
    it('should return the correct style for selected state with clicked model', () => {
      const { result } = renderHook(() => useJobCard({}));
      
      const style = result.current.getCardStyle(true, 3);
      
      expect(style.backgroundColor).toBe('lightgray');
      expect(style.border).toBe('1px solid #E5E5E5');
      expect(style.cursor).toBe('pointer');
    });
    
    it('should return the correct style for unselected state', () => {
      const { result } = renderHook(() => useJobCard({}));
      
      const style = result.current.getCardStyle(false, null);
      
      expect(style.backgroundColor).toBe('#E5E5E5');
      expect(style.border).toBe('1px solid #E5E5E5');
      expect(style.cursor).toBe('pointer');
    });
  });
  
  describe('setClickedModel', () => {
    it('should update the clickedModel state', () => {
      const { result } = renderHook(() => useJobCard({}));
      
      expect(result.current.clickedModel).toBeNull();
      
      act(() => {
        result.current.setClickedModel(3);
      });
      
      expect(result.current.clickedModel).toBe(3);
      
      act(() => {
        result.current.setClickedModel(null);
      });
      
      expect(result.current.clickedModel).toBeNull();
    });
  });
});