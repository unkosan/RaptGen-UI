import { renderHook, act } from '@testing-library/react-hooks';
import { useUploadFile } from '../use-upload-file';
import { useDispatch } from 'react-redux';
import { setSelexDataState } from '../../../redux/selex-data';

// Mock the dependencies
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../../redux/selex-data', () => ({
  setSelexDataState: jest.fn(),
}));

// Mock lodash's countBy function
jest.mock('lodash', () => ({
  countBy: (arr: string[]) => {
    // Simple implementation for testing
    const result: Record<string, number> = {};
    arr.forEach(item => {
      result[item] = (result[item] || 0) + 1;
    });
    return result;
  },
}));

describe('useUploadFile', () => {
  // Setup common mocks
  const mockDispatch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock dispatch
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    
    // Mock action creator
    (setSelexDataState as unknown as jest.Mock).mockImplementation((payload) => ({
      type: 'SET_SELEX_DATA_STATE',
      payload,
    }));
  });
  
  it('should return the correct initial values', () => {
    const { result } = renderHook(() => useUploadFile());
    
    expect(result.current.dataSource).toEqual([]);
    expect(result.current.isValidFile).toBe(true);
    expect(result.current.feedback).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.handleFile).toBe('function');
  });
  
  it('should handle valid FASTA file upload', async () => {
    const { result } = renderHook(() => useUploadFile());
    
    // Create a mock file
    const fastaContent = '>Sequence1\nACGTU\n>Sequence2\nUGCAA\n>Sequence3\nACGTU';
    const file = new File([fastaContent], 'test.fasta', { type: 'text/plain' });
    
    // Create a mock file input event
    const mockEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    // Mock file.text() method
    file.text = jest.fn().mockResolvedValue(fastaContent);
    
    // Handle file upload
    await act(async () => {
      await result.current.handleFile(mockEvent);
    });
    
    // Check loading state during file processing
    expect(result.current.isLoading).toBe(false);
    
    // Check final state
    expect(result.current.isValidFile).toBe(true);
    expect(result.current.feedback).toBe('');
    
    // Check extracted sequences
    expect(result.current.dataSource).toEqual([
      { id: 0, sequence: 'ACGTU', duplicate: 2 },
      { id: 1, sequence: 'UGCAA', duplicate: 1 },
    ]);
    
    // Check Redux action
    expect(setSelexDataState).toHaveBeenCalledWith({
      sequences: ['ACGTU', 'UGCAA'],
      duplicates: [2, 1],
    });
    
    expect(mockDispatch).toHaveBeenCalled();
  });
  
  it('should handle valid FASTQ file upload', async () => {
    const { result } = renderHook(() => useUploadFile());
    
    // Create a mock file
    const fastqContent = '@Sequence1\nACGTU\n@Sequence2\nUGCAA\n@Sequence3\nACGTU';
    const file = new File([fastqContent], 'test.fastq', { type: 'text/plain' });
    
    // Create a mock file input event
    const mockEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    // Mock file.text() method
    file.text = jest.fn().mockResolvedValue(fastqContent);
    
    // Handle file upload
    await act(async () => {
      await result.current.handleFile(mockEvent);
    });
    
    // Check final state
    expect(result.current.isValidFile).toBe(true);
    expect(result.current.feedback).toBe('');
    
    // Check extracted sequences
    expect(result.current.dataSource).toEqual([
      { id: 0, sequence: 'ACGTU', duplicate: 2 },
      { id: 1, sequence: 'UGCAA', duplicate: 1 },
    ]);
    
    // Check Redux action
    expect(setSelexDataState).toHaveBeenCalledWith({
      sequences: ['ACGTU', 'UGCAA'],
      duplicates: [2, 1],
    });
  });
  
  it('should handle unsupported file type', async () => {
    const { result } = renderHook(() => useUploadFile());
    
    // Create a mock file with unsupported extension
    const file = new File(['some content'], 'test.txt', { type: 'text/plain' });
    
    // Create a mock file input event
    const mockEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    // Mock file.text() method
    file.text = jest.fn().mockResolvedValue('some content');
    
    // Handle file upload
    await act(async () => {
      await result.current.handleFile(mockEvent);
    });
    
    // Check final state
    expect(result.current.isValidFile).toBe(false);
    expect(result.current.feedback).toBe("File type 'txt' is not supported");
    expect(result.current.dataSource).toEqual([]);
    expect(setSelexDataState).not.toHaveBeenCalled();
  });
  
  it('should handle file with no sequences', async () => {
    const { result } = renderHook(() => useUploadFile());
    
    // Create a mock file with invalid content
    const invalidContent = '>Sequence1\n>Sequence2\n';
    const file = new File([invalidContent], 'test.fasta', { type: 'text/plain' });
    
    // Create a mock file input event
    const mockEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    // Mock file.text() method
    file.text = jest.fn().mockResolvedValue(invalidContent);
    
    // Handle file upload
    await act(async () => {
      await result.current.handleFile(mockEvent);
    });
    
    // Check final state
    expect(result.current.isValidFile).toBe(false);
    expect(result.current.feedback).toBe('No sequences found');
    expect(result.current.dataSource).toEqual([]);
    expect(setSelexDataState).not.toHaveBeenCalled();
  });
  
  it('should handle error during file processing', async () => {
    const { result } = renderHook(() => useUploadFile());
    
    // Create a mock file
    const file = new File(['some content'], 'test.fasta', { type: 'text/plain' });
    
    // Create a mock file input event
    const mockEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    // Mock file.text() method to throw an error
    file.text = jest.fn().mockRejectedValue(new Error('File reading error'));
    
    // Handle file upload
    await act(async () => {
      await result.current.handleFile(mockEvent);
    });
    
    // Check final state
    expect(result.current.isValidFile).toBe(false);
    expect(result.current.feedback).toBe('Some error occurred');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.dataSource).toEqual([]);
    expect(setSelexDataState).not.toHaveBeenCalled();
  });
  
  it('should do nothing when no file is selected', async () => {
    const { result } = renderHook(() => useUploadFile());
    
    // Create a mock file input event with no files
    const mockEvent = {
      target: {
        files: null,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    // Handle file upload
    await act(async () => {
      await result.current.handleFile(mockEvent);
    });
    
    // State should remain unchanged
    expect(result.current.isValidFile).toBe(true);
    expect(result.current.feedback).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.dataSource).toEqual([]);
    expect(setSelexDataState).not.toHaveBeenCalled();
  });
});