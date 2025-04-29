import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import HistoricalDataExtractor from './HistoricalDataExtractor';
import { BlockRange, NFTEvent } from './types';

describe('HistoricalDataExtractor', () => {
    let extractor: HistoricalDataExtractor;

    beforeEach(() => {
        extractor = new HistoricalDataExtractor(100, 3); // chunk size 100, max 3 parallel chunks
    });

    describe('Initialization', () => {
        it('should create instance with default values', () => {
            const defaultExtractor = new HistoricalDataExtractor();
            expect(defaultExtractor).toBeInstanceOf(HistoricalDataExtractor);
        });

        it('should create instance with custom values', () => {
            expect(extractor).toBeInstanceOf(HistoricalDataExtractor);
        });
    });

    describe('Historical Data Extraction', () => {
        it('should calculate correct number of chunks', async () => {
            const startBlock = 1000;
            const endBlock = 1500;
            
            const extractPromise = extractor.extractHistoricalData(startBlock, endBlock);
            const progress = extractor.getProgress();
            
            expect(progress.totalChunks).toBe(5); // (1500-1000)/100 = 5 chunks
            await extractPromise;
        });

        it('should handle prioritization function', async () => {
            const startBlock = 1000;
            const endBlock = 1300;
            const priorityFn = (chunk: BlockRange) => chunk.start;

            const progressEvents: any[] = [];
            extractor.on('progress', (progress) => progressEvents.push(progress));

            await extractor.extractHistoricalData(startBlock, endBlock, priorityFn);

            expect(progressEvents.length).toBeGreaterThan(0);
        });

        it('should prevent concurrent extractions', async () => {
            const extraction1 = extractor.extractHistoricalData(1000, 1200);
            await expect(extractor.extractHistoricalData(1300, 1500))
                .rejects
                .toThrow('Historical data extraction already in progress');
            await extraction1;
        });

        it('should emit progress events', async () => {
            const progressEvents: any[] = [];
            extractor.on('progress', (progress) => progressEvents.push(progress));

            await extractor.extractHistoricalData(1000, 1200);

            expect(progressEvents.length).toBeGreaterThan(0);
            expect(progressEvents[progressEvents.length - 1].status).toBe('completed');
        });

        it('should handle errors in chunk processing', async () => {
            const mockError = new Error('Chunk processing failed');
            jest.spyOn(extractor as any, 'processChunk')
                .mockRejectedValueOnce(mockError);

            const errorHandler = jest.fn();
            extractor.on('error', errorHandler);

            await expect(extractor.extractHistoricalData(1000, 1100))
                .rejects
                .toThrow(mockError);

            expect(errorHandler).toHaveBeenCalled();
        });

        it('should complete extraction with correct events', async () => {
            const events: NFTEvent[] = [];
            extractor.on('chunkComplete', ({ events: chunkEvents }) => {
                events.push(...chunkEvents);
            });

            await extractor.extractHistoricalData(1000, 1200);

            const finalProgress = extractor.getProgress();
            expect(finalProgress.status).toBe('completed');
            expect(finalProgress.completedChunks).toBe(finalProgress.totalChunks);
        });
    });
});