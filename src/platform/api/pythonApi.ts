// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    EventEmitter,
    Event,
    Uri,
    CancellationToken
} from 'vscode';
import { IPythonApiProvider, IPythonExtensionChecker, PythonApi, PythonEnvironment_PythonApi } from './types';
import { injectable, inject } from 'inversify';
import { IDisposableRegistry, IExtensionContext } from '../common/types';
import { IInterpreterService } from '../interpreter/contracts';
import { PythonEnvironment } from '../pythonEnvironments/info';
import { Environment, PythonExtension as PythonExtensionApi, ResolvedEnvironment } from '@vscode/python-extension';
import { getFilePath } from '../common/platform/fs-paths';
import { getEnvironmentType } from '../interpreter/helpers';
import { EnvironmentType } from '../pythonEnvironments/info';
import { getOSType, OSType } from '../common/utils/platform';
import { logger } from '../logging';
import { getDisplayPath } from '../common/platform/fs-paths';

export function deserializePythonEnvironment(
    pythonVersion: Partial<PythonEnvironment_PythonApi> | undefined,
    pythonEnvId: string
): PythonEnvironment | undefined {
    if (pythonVersion) {
        const result = {
            ...pythonVersion,
            uri: Uri.file(pythonVersion.path || ''),
            id: pythonEnvId || (pythonVersion as any).id
        };

        // Cleanup stuff that shouldn't be there.
        delete result.path;
        return result;
    }
}
export function pythonEnvToJupyterEnv(env: Environment): PythonEnvironment | undefined {
    let uri: Uri;
    let id = env.id;
    if (!env.executable.uri) {
        if (getEnvironmentType(env) === EnvironmentType.Conda) {
            uri =
                getOSType() === OSType.Windows
                    ? Uri.joinPath(env.environment?.folderUri || Uri.file(env.path), 'python.exe')
                    : Uri.joinPath(env.environment?.folderUri || Uri.file(env.path), 'bin', 'python');
        } else {
            logger.warn(`Python environment ${getDisplayPath(env.id)} excluded as Uri is undefined`);
            return;
        }
    } else {
        uri = env.executable.uri;
    }

    return {
        id,
        uri
    };
}

export function serializePythonEnvironment(
    jupyterVersion: PythonEnvironment | undefined
): PythonEnvironment_PythonApi | undefined {
    if (jupyterVersion) {
        const result = Object.assign({}, jupyterVersion, {
            path: getFilePath(jupyterVersion.uri)
        });
        // Cleanup stuff that shouldn't be there.
        delete (result as any).uri;
        return result;
    }
}

/* eslint-disable max-classes-per-file */

// mspython dependency has been removed - all classes are stubs

@injectable()
export class OldPythonApiProvider implements IPythonApiProvider {
    private readonly didActivatePython = new EventEmitter<void>();
    public get onDidActivatePythonExtension() {
        return this.didActivatePython.event;
    }

    // Python extension is not available - resolve immediately
    public get pythonExtensionHooked(): Promise<void> {
        return Promise.resolve();
    }
    public get pythonExtensionVersion(): undefined {
        return undefined;
    }

    constructor(
        @inject(IDisposableRegistry) _disposables: IDisposableRegistry
    ) {
    }

    public getApi(): Promise<PythonApi> {
        return Promise.resolve({} as PythonApi);
    }

    public getNewApi(): Promise<PythonExtensionApi | undefined> {
        return Promise.resolve(undefined);
    }

    public setApi(_api: PythonApi): void {
        // no-op: Python extension not available
    }
}

@injectable()
export class PythonExtensionChecker implements IPythonExtensionChecker {
    private readonly pythonExtensionInstallationStatusChanged = new EventEmitter<'installed' | 'uninstalled'>();
    public get onPythonExtensionInstallationStatusChanged() {
        return this.pythonExtensionInstallationStatusChanged.event;
    }

    public static promptDisplayed?: boolean;

    constructor(@inject(IDisposableRegistry) _disposables: IDisposableRegistry) {
        // no-op
    }

    // Python extension is not used in this build
    public get isPythonExtensionInstalled() {
        return false;
    }
    public get isPythonExtensionActive() {
        return false;
    }

    public async directlyInstallPythonExtension(): Promise<void> {
        // no-op: Python extension not available
    }

    public async showPythonExtensionInstallRequiredPrompt(): Promise<void> {
        // no-op: don't prompt for Python extension
    }
}

// eslint-disable-next-line max-classes-per-file
@injectable()
export class InterpreterService implements IInterpreterService {
    private readonly didChangeInterpreter = new EventEmitter<PythonEnvironment | undefined>();
    private readonly didChangeInterpreters = new EventEmitter<PythonEnvironment[]>();
    private readonly _onDidEnvironmentVariablesChange = new EventEmitter<void>();
    private readonly _onDidRemoveInterpreter = new EventEmitter<{ id: string }>();
    public onDidRemoveInterpreter = this._onDidRemoveInterpreter.event;
    public onDidEnvironmentVariablesChange = this._onDidEnvironmentVariablesChange.event;
    private _status: 'refreshing' | 'idle' = 'idle';
    public get status() {
        return this._status;
    }
    private set status(value: typeof this._status) {
        if (this._status === value) {
            return;
        }
        this._status = value;
        this._onDidChangeStatus.fire();
    }
    private readonly _onDidChangeStatus = new EventEmitter<void>();
    public readonly onDidChangeStatus = this._onDidChangeStatus.event;

    constructor(
        @inject(IPythonApiProvider) _apiProvider: IPythonApiProvider,
        @inject(IPythonExtensionChecker) _extensionChecker: IPythonExtensionChecker,
        @inject(IDisposableRegistry) disposables: IDisposableRegistry,
        @inject(IExtensionContext) _context: IExtensionContext
    ) {
        disposables.push(this._onDidChangeStatus);
    }

    public initialize() {
        // no-op: Python extension not available
    }

    public async hasWorkspaceSpecificEnvironment(): Promise<boolean> {
        return false;
    }

    public async resolveEnvironment(_id: string | Environment): Promise<ResolvedEnvironment | undefined> {
        return undefined;
    }

    public get onDidChangeInterpreter(): Event<PythonEnvironment | undefined> {
        return this.didChangeInterpreter.event;
    }

    public get onDidChangeInterpreters(): Event<PythonEnvironment[]> {
        return this.didChangeInterpreters.event;
    }

    public async refreshInterpreters(_forceRefresh: boolean = false) {
        // no-op: Python extension not available
    }

    public async getActiveInterpreter(_resource?: Uri): Promise<PythonEnvironment | undefined> {
        return undefined;
    }

    public getInterpreterHash(_id: string): string | undefined {
        return undefined;
    }

    public async getInterpreterDetails(
        _pythonPath: Uri | { path: string } | string,
        _token?: CancellationToken
    ): Promise<undefined> {
        return undefined;
    }
}
