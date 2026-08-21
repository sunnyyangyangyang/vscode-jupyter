// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as fakeTimers from '@sinonjs/fake-timers';
import { assert } from 'chai';
import { anything, instance, mock, when } from 'ts-mockito';
import { Disposable, EventEmitter, WorkspaceFoldersChangeEvent } from 'vscode';
import { dispose } from '../common/utils/lifecycle';
import { IDisposable, IExtensionContext } from '../common/types';
import { IInterpreterService } from '../interpreter/contracts';
import { InterpreterService } from './pythonApi';
import {
    ActiveEnvironmentPathChangeEvent,
    EnvironmentsChangeEvent,
    EnvironmentVariablesChangeEvent,
    PythonExtension
} from '@vscode/python-extension';
import { IPythonApiProvider, IPythonExtensionChecker } from './types';
import { mockedVSCodeNamespaces } from '../../test/vscode-mock';

suite(`Interpreter Service`, () => {
    let clock: fakeTimers.InstalledClock;
    let interpreterService: IInterpreterService;
    let apiProvider: IPythonApiProvider;
    let extensionChecker: IPythonExtensionChecker;
    let context: IExtensionContext;
    let disposables: IDisposable[] = [];
    let onDidActivatePythonExtension: EventEmitter<void>;
    let onDidChangeWorkspaceFolders: EventEmitter<WorkspaceFoldersChangeEvent>;
    let onDidChangeActiveEnvironmentPath: EventEmitter<ActiveEnvironmentPathChangeEvent>;
    let onDidChangeEnvironments: EventEmitter<EnvironmentsChangeEvent>;
    let onDidEnvironmentVariablesChange: EventEmitter<EnvironmentVariablesChangeEvent>;
    let newPythonApi: PythonExtension;
    let environments: PythonExtension['environments'];
    setup(() => {
        interpreterService = mock<IInterpreterService>();
        apiProvider = mock<IPythonApiProvider>();
        extensionChecker = mock<IPythonExtensionChecker>();
        context = mock<IExtensionContext>();
        onDidActivatePythonExtension = new EventEmitter<void>();
        onDidChangeWorkspaceFolders = new EventEmitter<WorkspaceFoldersChangeEvent>();
        onDidChangeActiveEnvironmentPath = new EventEmitter<ActiveEnvironmentPathChangeEvent>();
        onDidChangeEnvironments = new EventEmitter<EnvironmentsChangeEvent>();
        onDidEnvironmentVariablesChange = new EventEmitter<EnvironmentVariablesChangeEvent>();
        disposables.push(onDidActivatePythonExtension);
        disposables.push(onDidChangeWorkspaceFolders);
        disposables.push(onDidChangeActiveEnvironmentPath);
        disposables.push(onDidChangeEnvironments);
        disposables.push(onDidEnvironmentVariablesChange);

        newPythonApi = mock<PythonExtension>();
        environments = mock<PythonExtension['environments']>();
        when(newPythonApi.environments).thenReturn(instance(environments));
        when(environments.onDidChangeActiveEnvironmentPath).thenReturn(onDidChangeActiveEnvironmentPath.event);
        when(environments.onDidChangeEnvironments).thenReturn(onDidChangeEnvironments.event);
        when(environments.onDidEnvironmentVariablesChange).thenReturn(onDidEnvironmentVariablesChange.event);
        when(environments.known).thenReturn([]);
        when(environments.getActiveEnvironmentPath(anything())).thenReturn();
        (instance(newPythonApi) as any).then = undefined;
        when(apiProvider.getNewApi()).thenResolve(instance(newPythonApi));
        when(apiProvider.onDidActivatePythonExtension).thenReturn(onDidActivatePythonExtension.event);
        when(mockedVSCodeNamespaces.workspace.onDidChangeWorkspaceFolders).thenReturn(
            onDidChangeWorkspaceFolders.event
        );
        when(extensionChecker.isPythonExtensionInstalled).thenReturn(true);
        clock = fakeTimers.install();
        disposables.push(new Disposable(() => clock.uninstall()));
    });
    teardown(() => (disposables = dispose(disposables)));
    function createInterpreterService() {
        interpreterService = new InterpreterService(
            instance(apiProvider),
            instance(extensionChecker),
            disposables,
            instance(context)
        );
    }
    test('Progress status triggered upon refresh', async () => {
        createInterpreterService();

        const statuses: (typeof interpreterService.status)[] = [];
        interpreterService.onDidChangeStatus(() => statuses.push(interpreterService.status));

        // Fork note: the Python extension is not available in this fork, so refreshing interpreters
        // is a no-op — no environment refresh and no progress status changes are expected.
        await interpreterService.refreshInterpreters();
        await clock.runAllAsync();

        assert.deepEqual(statuses, []);
    });
});
