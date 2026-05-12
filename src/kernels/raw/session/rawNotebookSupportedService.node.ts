// Local kernel support has been disabled

import { injectable } from 'inversify';
import { IRawNotebookSupportedService } from '../types';

@injectable()
export class RawNotebookSupportedService implements IRawNotebookSupportedService {
    // Local kernels are disabled - only remote Jupyter servers are supported
    public get isSupported(): boolean {
        return false;
    }
}
