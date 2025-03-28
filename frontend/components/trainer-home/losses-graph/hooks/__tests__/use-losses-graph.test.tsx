import { renderHook, act } from '@testing-library/react-hooks';
import { useLossDataPlot, useDownloadCsv, LossData } from '../use-losses-graph';
import { downloadFileFromText } from '~/components/viewer/downloader/hooks/utils';

// Mock the dependencies
jest.mock('~/components/viewer/downloader/hooks/utils', () => ({
  downloadFileFromText: jest.fn(),
}));

describe('useLossDataPlot', () => {
  // Mock data
  const mockLossData: LossData = {
    epochs: [1, 2, 3, 4, 5],
    trainLosses: [0.5, 0.4, 0.3, 0.25, 0.2],
    testLosses: [0.6, 0.5, 0.45, 0.4, 0.35],
    testRecons: [0.4, 0.35, 0.3, 0.25, 0.2],
    testKlds: [0.2, 0.15, 0.15, 0.15, 0.15],
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return the correct plot data for all loss types', () => {
    const { result } = renderHook(() => useLossDataPlot(mockLossData));
    
    const plots = result.current;
    
    // Should return 4 traces
    expect(plots).toHaveLength(4);
    
    // Check train loss trace
    const trainLossTrace = plots[0];
    expect(trainLossTrace.x).toEqual(mockLossData.epochs);
    expect(trainLossTrace.y).toEqual(mockLossData.trainLosses);
    expect(trainLossTrace.type).toBe('scatter');
    expect(trainLossTrace.mode).toBe('lines');
    expect(trainLossTrace.name).toBe('Train loss');
    expect(trainLossTrace.line?.color).toBe('#000000');
    expect(trainLossTrace.hovertemplate).toContain('Epoch: %{x}<br>');
    expect(trainLossTrace.hovertemplate).toContain('NLL (ELBO): %{y}<br>');
    
    // Check test loss trace
    const testLossTrace = plots[1];
    expect(testLossTrace.x).toEqual(mockLossData.epochs);
    expect(testLossTrace.y).toEqual(mockLossData.testLosses);
    expect(testLossTrace.type).toBe('scatter');
    expect(testLossTrace.mode).toBe('lines');
    expect(testLossTrace.name).toBe('Test loss');
    expect(testLossTrace.line?.color).toBe('#FF0000');
    
    // Check test reconstruction loss trace
    const testReconTrace = plots[2];
    expect(testReconTrace.x).toEqual(mockLossData.epochs);
    expect(testReconTrace.y).toEqual(mockLossData.testRecons);
    expect(testReconTrace.type).toBe('scatter');
    expect(testReconTrace.mode).toBe('lines');
    expect(testReconTrace.name).toBe('Test reconstruction loss');
    expect(testReconTrace.line?.color).toBe('#00FF00');
    
    // Check test KL divergence loss trace
    const testKldTrace = plots[3];
    expect(testKldTrace.x).toEqual(mockLossData.epochs);
    expect(testKldTrace.y).toEqual(mockLossData.testKlds);
    expect(testKldTrace.type).toBe('scatter');
    expect(testKldTrace.mode).toBe('lines');
    expect(testKldTrace.name).toBe('Test KL divergence loss');
    expect(testKldTrace.line?.color).toBe('#0000FF');
  });
  
  it('should update plot data when lossData changes', () => {
    const { result, rerender } = renderHook(
      (props) => useLossDataPlot(props),
      { initialProps: mockLossData }
    );
    
    // Initial render
    expect(result.current[0].y).toEqual(mockLossData.trainLosses);
    
    // Update lossData
    const updatedLossData: LossData = {
      epochs: [1, 2, 3],
      trainLosses: [0.3, 0.2, 0.1],
      testLosses: [0.4, 0.3, 0.2],
      testRecons: [0.2, 0.15, 0.1],
      testKlds: [0.1, 0.05, 0.05],
    };
    
    // Rerender with new props
    rerender(updatedLossData);
    
    // Check updated data
    expect(result.current[0].x).toEqual(updatedLossData.epochs);
    expect(result.current[0].y).toEqual(updatedLossData.trainLosses);
    expect(result.current[1].y).toEqual(updatedLossData.testLosses);
    expect(result.current[2].y).toEqual(updatedLossData.testRecons);
    expect(result.current[3].y).toEqual(updatedLossData.testKlds);
  });
});

describe('useDownloadCsv', () => {
  // Mock data
  const mockLossData: LossData = {
    epochs: [1, 2, 3],
    trainLosses: [0.5, 0.4, 0.3],
    testLosses: [0.6, 0.5, 0.45],
    testRecons: [0.4, 0.35, 0.3],
    testKlds: [0.2, 0.15, 0.15],
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should call downloadFileFromText with correct CSV data when handleClickSave is called', () => {
    const { result } = renderHook(() => useDownloadCsv(mockLossData));
    
    // Call the download function
    act(() => {
      result.current.handleClickSave();
    });
    
    // Expected CSV content
    const expectedCsvHeader = 'epoch, train_loss, test_loss, test_recon, test_kld';
    const expectedCsvData = 
      '0,0.5,0.6,0.4,0.2\n' +
      '1,0.4,0.5,0.35,0.15\n' +
      '2,0.3,0.45,0.3,0.15\n';
    
    // Check that downloadFileFromText was called with correct arguments
    expect(downloadFileFromText).toHaveBeenCalledWith(
      expectedCsvHeader + '\n' + expectedCsvData,
      'losses.csv'
    );
  });
  
  it('should update CSV data when lossData changes', () => {
    const { result, rerender } = renderHook(
      (props) => useDownloadCsv(props),
      { initialProps: mockLossData }
    );
    
    // Call the download function
    act(() => {
      result.current.handleClickSave();
    });
    
    // Check initial call
    expect(downloadFileFromText).toHaveBeenCalledTimes(1);
    
    // Update lossData
    const updatedLossData: LossData = {
      epochs: [1, 2],
      trainLosses: [0.3, 0.2],
      testLosses: [0.4, 0.3],
      testRecons: [0.2, 0.15],
      testKlds: [0.1, 0.05],
    };
    
    // Rerender with new props
    rerender(updatedLossData);
    
    // Call the download function again
    act(() => {
      result.current.handleClickSave();
    });
    
    // Expected updated CSV content
    const expectedCsvHeader = 'epoch, train_loss, test_loss, test_recon, test_kld';
    const expectedCsvData = 
      '0,0.3,0.4,0.2,0.1\n' +
      '1,0.2,0.3,0.15,0.05\n';
    
    // Check that downloadFileFromText was called with updated arguments
    expect(downloadFileFromText).toHaveBeenCalledWith(
      expectedCsvHeader + '\n' + expectedCsvData,
      'losses.csv'
    );
    
    expect(downloadFileFromText).toHaveBeenCalledTimes(2);
  });
});