import { renderHook, act } from '@testing-library/react';
import { useVaeDataPlot, useDownloadCsv, VaeData } from '../use-latent-space-plots';
import { useSelector } from 'react-redux';
import { latentGraphLayout } from '~/components/common/graph-helper';
import { downloadFileFromText } from '~/components/viewer/downloader/hooks/utils';

// Mock the dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('~/components/common/graph-helper', () => ({
  latentGraphLayout: jest.fn(),
}));

jest.mock('~/components/viewer/downloader/hooks/utils', () => ({
  downloadFileFromText: jest.fn(),
}));

describe('useVaeDataPlot', () => {
  // Mock data
  const mockVaeData: VaeData = {
    coordsX: [0.1, 0.2, 0.3, 0.4, 0.5],
    coordsY: [1.1, 1.2, 1.3, 1.4, 1.5],
    randomRegions: ['region1', 'region2', 'region3', 'region4', 'region5'],
    duplicates: [3, 5, 2, 10, 1],
  };

  // Mock layout
  const mockLayout = {
    title: { text: '' },
    plot_bgcolor: '#EDEDED',
    xaxis: {
      color: '#FFFFFF',
      tickfont: { color: '#000000' },
      range: [-3.5, 3.5],
      gridcolor: '#FFFFFF',
    },
    yaxis: {
      color: '#FFFFFF',
      tickfont: { color: '#000000' },
      range: [-3.5, 3.5],
      gridcolor: '#FFFFFF',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock selector
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Simulate the Redux state
      const state = {
        graphConfig: {
          minCount: 3,
        },
      };
      return selector(state);
    });
    
    // Mock layout
    (latentGraphLayout as jest.Mock).mockReturnValue(mockLayout);
  });
  
  it('should return the correct plot data and layout', () => {
    const { result } = renderHook(() => useVaeDataPlot(mockVaeData));
    
    // Check layout
    expect(result.current.layout).toEqual(mockLayout);
    expect(latentGraphLayout).toHaveBeenCalledWith('');
    
    // Check plot data
    const plot = result.current.vaeDataPlot;
    
    // Should filter out points with duplicates < minCount (3)
    expect(plot.x).toEqual([0.1, 0.2, 0.4]);
    expect(plot.y).toEqual([1.1, 1.2, 1.4]);
    
    // Check marker properties
    expect(plot.type).toBe('scatter');
    expect(plot.mode).toBe('markers');
    expect(plot.marker).toEqual({
      size: expect.any(Array),
      color: 'black',
      opacity: 0.5,
      line: {
        color: 'black',
      },
    });
    
    // Check marker sizes (should be Math.max(2, Math.sqrt(duplicate)))
    expect(plot.marker?.size).toEqual([
      Math.max(2, Math.sqrt(3)),
      Math.max(2, Math.sqrt(5)),
      Math.max(2, Math.sqrt(10)),
    ]);
    
    // Check customdata
    expect(plot.customdata).toEqual([
      ['region1', '3'],
      ['region2', '5'],
      ['region4', '10'],
    ]);
  });
  
  it('should update plot data when minCount changes', () => {
    const { result, rerender } = renderHook(() => useVaeDataPlot(mockVaeData));
    
    // Initial render with minCount = 3
    expect(result.current.vaeDataPlot.x).toEqual([0.1, 0.2, 0.4]);
    expect(result.current.vaeDataPlot.y).toEqual([1.1, 1.2, 1.4]);
    
    // Update minCount to 5
    (useSelector as jest.Mock).mockImplementation((selector) => {
      const state = {
        graphConfig: {
          minCount: 5,
        },
      };
      return selector(state);
    });
    
    // Rerender to trigger effect
    rerender();
    
    // Should now only include points with duplicates >= 5
    expect(result.current.vaeDataPlot.x).toEqual([0.2, 0.4]);
    expect(result.current.vaeDataPlot.y).toEqual([1.2, 1.4]);
    expect(result.current.vaeDataPlot.customdata).toEqual([
      ['region2', '5'],
      ['region4', '10'],
    ]);
  });
  
  it('should update plot data when vaeData changes', () => {
    const { result, rerender } = renderHook(
      (props) => useVaeDataPlot(props),
      { initialProps: mockVaeData }
    );
    
    // Initial render
    expect(result.current.vaeDataPlot.x).toEqual([0.1, 0.2, 0.4]);
    expect(result.current.vaeDataPlot.y).toEqual([1.1, 1.2, 1.4]);
    
    // Update vaeData
    const updatedVaeData: VaeData = {
      coordsX: [0.6, 0.7, 0.8],
      coordsY: [1.6, 1.7, 1.8],
      randomRegions: ['region6', 'region7', 'region8'],
      duplicates: [4, 2, 6],
    };
    
    // Rerender with new props
    rerender(updatedVaeData);
    
    // Should filter based on minCount = 3
    expect(result.current.vaeDataPlot.x).toEqual([0.6, 0.8]);
    expect(result.current.vaeDataPlot.y).toEqual([1.6, 1.8]);
    expect(result.current.vaeDataPlot.customdata).toEqual([
      ['region6', '4'],
      ['region8', '6'],
    ]);
  });
});

describe('useDownloadCsv', () => {
  // Mock data
  const mockVaeData: VaeData = {
    coordsX: [0.1, 0.2, 0.3],
    coordsY: [1.1, 1.2, 1.3],
    randomRegions: ['region1', 'region2', 'region3'],
    duplicates: [3, 5, 2],
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should call downloadFileFromText with correct CSV data when handleClickSave is called', () => {
    const { result } = renderHook(() => useDownloadCsv(mockVaeData));
    
    // Call the download function
    act(() => {
      result.current.handleClickSave();
    });
    
    // Expected CSV content
    const expectedCsvHeader = 'random_region, x, y, duplicate';
    const expectedCsvData =
      'region1,0.1,1.1,3\n' +
      'region2,0.2,1.2,5\n' +
      'region3,0.3,1.3,2\n';
    
    // Check that downloadFileFromText was called with correct arguments
    expect(downloadFileFromText).toHaveBeenCalledWith(
      expectedCsvHeader + '\n' + expectedCsvData,
      'latent_points.csv'
    );
  });
  
  it('should update CSV data when vaeData changes', () => {
    const { result, rerender } = renderHook(
      (props) => useDownloadCsv(props),
      { initialProps: mockVaeData }
    );
    
    // Call the download function
    act(() => {
      result.current.handleClickSave();
    });
    
    // Check initial call
    expect(downloadFileFromText).toHaveBeenCalledTimes(1);
    
    // Update vaeData
    const updatedVaeData: VaeData = {
      coordsX: [0.4, 0.5],
      coordsY: [1.4, 1.5],
      randomRegions: ['region4', 'region5'],
      duplicates: [4, 6],
    };
    
    // Rerender with new props
    rerender(updatedVaeData);
    
    // Call the download function again
    act(() => {
      result.current.handleClickSave();
    });
    
    // Expected updated CSV content
    const expectedCsvHeader = 'random_region, x, y, duplicate';
    const expectedCsvData =
      'region4,0.4,1.4,4\n' +
      'region5,0.5,1.5,6\n';
    
    // Check that downloadFileFromText was called with updated arguments
    expect(downloadFileFromText).toHaveBeenCalledWith(
      expectedCsvHeader + '\n' + expectedCsvData,
      'latent_points.csv'
    );
    
    expect(downloadFileFromText).toHaveBeenCalledTimes(2);
  });
});