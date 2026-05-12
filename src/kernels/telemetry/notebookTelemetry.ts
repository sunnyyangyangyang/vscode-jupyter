// Telemetry has been disabled - notebook telemetry is no-op

import { type NotebookDocument, type Uri } from 'vscode';
import { DisposableStore } from '../../platform/common/utils/lifecycle';
import { isUri } from '../../platform/common/utils/misc';
import { once } from '../../platform/common/utils/functional';

/* eslint-disable @typescript-eslint/no-use-before-define */

const notebooksOpenedTime = new WeakMap<NotebookDocument, ReturnType<typeof createNotebookTracker>>();
const uriToNotebookMap = new Map<string, WeakRef<NotebookDocument>>();
let mainStopWatch: { elapsedTime: number };

export function getNotebookTelemetryTracker(query: NotebookDocument | Uri | undefined) {
    if (!query) {
        return;
    }
    if (isUri(query) && !uriToNotebookMap.has(query.toString())) {
        const nb = require('vscode').workspace.notebookDocuments.find((item: NotebookDocument) => item.uri.toString() === query.toString());
        if (nb) {
            uriToNotebookMap.set(query.toString(), new WeakRef(nb));
        }
    }
    const notebook = isUri(query) ? uriToNotebookMap.get(query.toString())?.deref() : query;
    if (!notebook) {
        return;
    }

    return notebooksOpenedTime.get(notebook)?.tracker;
}

export function activateNotebookTelemetry(stopWatch: { elapsedTime: number }) {
    const disposable = new DisposableStore();
    mainStopWatch = stopWatch;
    const workspace = require('vscode').workspace;
    workspace.notebookDocuments.forEach((nb: NotebookDocument) =>
        notebooksOpenedTime.set(nb, createNotebookTracker(nb, true, stopWatch))
    );
    disposable.add(
        workspace.onDidOpenNotebookDocument((e: NotebookDocument) => {
            if (!notebooksOpenedTime.has(e)) {
                notebooksOpenedTime.set(e, createNotebookTracker(e, false, stopWatch));
            }
        })
    );
    disposable.add(
        workspace.onDidCloseNotebookDocument((e: NotebookDocument) => {
            notebooksOpenedTime.delete(e);
            uriToNotebookMap.delete(e.uri.toString());
        })
    );
    return disposable;
}

export function onDidManuallySelectKernel(notebook: NotebookDocument) {
    notebooksOpenedTime.get(notebook)?.tracker.kernelManuallySelected();
}

type Times = {
    preExecuteCellTelemetry: number;
    startKernel: number;
    executeCell: number;
    sessionTelemetry: number;
    postKernelStart: number;
    computeCwd: number;
    kernelInfo: number;
    kernelIdle: number;
    kernelReady: number;
    getConnection: number;
    updateConnection: number;
    portUsage: number;
    spawn: number;
    pythonEnvVars: number;
    envVars: number;
    interruptHandle: number;
};

type ExtraTimes = {
    controllerCreated: number;
    interpreterDiscovered: number;
    executeCellAcknowledged: number;
};

export type NotebookFirstStartBreakDownMeasures = Partial<
    { [K in keyof Times as `${K}StartedAfter`]: number } & { [K in keyof ExtraTimes as `${K}After`]: number } & {
        [K in keyof Times as `${K}CompletedAfter`]: number;
    } & {
        openedAfter: number;
        executeCellCount?: number;
        kernelSelectedAfter?: number;
    }
>;

const controllerCreationTimes = new Map<string, number>();
const interpreterDiscoveryTimes = new Map<string, number>();

export const trackPythonExtensionActivation = () => {
    return {
        stop: once(() => {})
    };
};

export function trackControllerCreation(kernelConnectionId: string, _pythonInterpreterId?: string) {
    controllerCreationTimes.set(kernelConnectionId, mainStopWatch?.elapsedTime);
}

export function trackInterpreterDiscovery(_pythonEnv: { executable?: { uri?: string }; id?: string }) {
    if (_pythonEnv.id) {
        interpreterDiscoveryTimes.set(_pythonEnv.id, mainStopWatch?.elapsedTime);
    }
}

function createNotebookTracker(
    _notebook: NotebookDocument,
    wasAlreadyOpen: boolean,
    stopWatch: { elapsedTime: number }
) {
    const openedAfter = stopWatch.elapsedTime;
    const measures: NotebookFirstStartBreakDownMeasures = {
        openedAfter
    };
    const emptyTracker: (count?: number) => { stop: () => void } = (_count?: number) => ({ stop: () => {} });
    const info: {
        manuallySelectedKernel?: boolean;
        wasAlreadyOpen: boolean;
    } = {
        wasAlreadyOpen
    };

    return {
        measures,
        info,
        tracker: {
            kernelSelected: (_kernelConnectionId: string, _interpreterId?: string) => {
                // no-op: telemetry disabled
            },
            kernelManuallySelected: () => { info.manuallySelectedKernel = true; },
            cellExecutionCount: emptyTracker,
            preExecuteCellTelemetry: emptyTracker,
            startKernel: emptyTracker,
            executeCell: emptyTracker,
            executeCellAcknowledged: emptyTracker,
            jupyterSessionTelemetry: emptyTracker,
            postKernelStartup: emptyTracker,
            computeCwd: emptyTracker,
            getConnection: emptyTracker,
            updateConnection: emptyTracker,
            kernelReady: emptyTracker,
            portUsage: emptyTracker,
            spawn: emptyTracker,
            pythonEnvVars: emptyTracker,
            envVars: emptyTracker,
            interruptHandle: emptyTracker,
            kernelInfo: emptyTracker,
            kernelIdle: emptyTracker
        }
    };
}
