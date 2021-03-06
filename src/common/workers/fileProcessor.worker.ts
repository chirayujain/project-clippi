// File processor worker

import { FileProcessor, FileProcessorOptions, ProcessOutput, ProcessResult } from "../fileProcessor";
import {
  FileProcessorParentMessage,
  FileProcessorWorkerMessage,
  ProgressingPayload,
  StartProcessingPayload,
} from "./fileProcessor.worker.types";

const fileProcessor = new FileProcessor();

const startProcessing = async (options: FileProcessorOptions): Promise<ProcessOutput> => {
  const callback = (index: number, total: number, filename: string, result: ProcessResult): void => {
    const payload: ProgressingPayload = {
      index,
      total,
      filename,
      result,
      options,
    };
    ctx.postMessage({
      type: FileProcessorWorkerMessage.PROGRESS,
      payload,
    });
  };
  return fileProcessor.process(options, callback);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.addEventListener("message", async (event) => {
  console.log("got message from parent. event data:");
  console.log(event.data);
  const eventType = event.data.type as FileProcessorParentMessage;
  switch (eventType) {
    case FileProcessorParentMessage.START:
      // If we're in the middle of processing, return busy
      if (fileProcessor.isProcessing()) {
        ctx.postMessage({
          type: FileProcessorWorkerMessage.BUSY,
        });
        return;
      }

      // Start the processing
      try {
        const startPayload = event.data.payload as StartProcessingPayload;
        const result = await startProcessing(startPayload.options);
        ctx.postMessage({
          type: FileProcessorWorkerMessage.COMPLETE,
          payload: {
            result,
            options: startPayload.options,
          },
        });
      } catch (err) {
        console.error(err);
        ctx.postMessage({
          type: FileProcessorWorkerMessage.ERROR,
          payload: {
            message: err.message,
          },
        });
        fileProcessor.reset();
      }
      break;
    case FileProcessorParentMessage.STOP:
      fileProcessor.stop();
      break;
  }
});
