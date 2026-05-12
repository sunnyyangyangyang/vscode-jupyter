// Telemetry has been disabled

import { inject, injectable } from 'inversify';
import { IExtensionSyncActivationService } from '../platform/activation/types';
import { IDisposableRegistry } from '../platform/common/types';
import { IKernelProvider } from './types';

@injectable()
export class KernelStartupTelemetry implements IExtensionSyncActivationService {
    constructor(
        @inject(IKernelProvider) _kernelProvider: IKernelProvider,
        @inject(IDisposableRegistry) _disposables: IDisposableRegistry
    ) {}
    activate(): void {
        // no-op: telemetry disabled
    }
}
