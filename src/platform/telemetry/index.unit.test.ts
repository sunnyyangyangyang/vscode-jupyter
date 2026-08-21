// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable , , @typescript-eslint/no-explicit-any */
import * as sinon from 'sinon';
import { expect } from 'chai';
import { instance, mock, reset, when } from 'ts-mockito';
import { Disposable, WorkspaceConfiguration } from 'vscode';
import {
    _resetSharedProperties,
    getTelemetryReporter,
    isTelemetryDisabled,
    sendTelemetryEvent,
    setSharedProperty
} from '../../telemetry';
import { isUnitTestExecution, isTestExecution, setTestExecution, setUnitTestExecution } from '../common/constants';
import { sleep } from '../../test/core';
import { mockedVSCodeNamespaces, resetVSCodeMocks } from '../../test/vscode-mock';
import { IDisposable } from '../common/types';
import { dispose } from '../common/utils/lifecycle';

suite('Telemetry', () => {
    const oldValueOfVSC_JUPYTER_UNIT_TEST = isUnitTestExecution();
    const oldValueOfVSC_JUPYTER_CI_TEST = isTestExecution();

    class Reporter {
        public static eventName: string[] = [];
        public static properties: Record<string, string>[] = [];
        public static measures: {}[] = [];
        public static errorProps: string[] | undefined;
        public static clear() {
            Reporter.eventName = [];
            Reporter.properties = [];
            Reporter.measures = [];
            Reporter.errorProps = undefined;
        }
    }

    // Fork note: the upstream asyncAssertReporterState helper was removed — with telemetry
    // stripped from this fork, tests assert that NO events ever reach a reporter instead.
    let disposables: IDisposable[] = [];
    setup(() => {
        resetVSCodeMocks();
        disposables.push(new Disposable(() => resetVSCodeMocks()));

        const reporter = getTelemetryReporter();
        sinon.stub(reporter, 'sendTelemetryEvent').callsFake((eventName: string, properties?: {}, measures?: {}) => {
            Reporter.eventName.push(eventName);
            Reporter.properties.push(properties!);
            Reporter.measures.push(measures!);
        });
        setTestExecution(false);
        setUnitTestExecution(false);
        Reporter.clear();
    });
    teardown(() => {
        disposables = dispose(disposables);
        sinon.restore();
        setUnitTestExecution(oldValueOfVSC_JUPYTER_UNIT_TEST);
        setTestExecution(oldValueOfVSC_JUPYTER_CI_TEST);
        _resetSharedProperties();
    });

    // Fork note: telemetry was removed in this fork, so isTelemetryDisabled() unconditionally
    // returns true regardless of user settings.
    const testsForisTelemetryDisabled = [
        {
            testName: 'Returns true when globalValue is set to false',
            settings: { globalValue: false },
            expectedResult: true
        },
        {
            testName: 'Returns true even when telemetry is not explicitly disabled (fork)',
            settings: {},
            expectedResult: true
        }
    ];

    suite('Function isTelemetryDisabled()', () => {
        testsForisTelemetryDisabled.forEach((testParams) => {
            test(testParams.testName, async () => {
                const workspaceConfig = mock<WorkspaceConfiguration>();
                reset(mockedVSCodeNamespaces.workspace);
                when(mockedVSCodeNamespaces.workspace.getConfiguration('telemetry')).thenReturn(
                    instance(workspaceConfig)
                );
                when(workspaceConfig.inspect<string>('enableTelemetry')).thenReturn(testParams.settings as any);

                // Fork note: user settings are no longer consulted (always disabled).
                expect(isTelemetryDisabled()).to.equal(testParams.expectedResult);
            });
        });
    });

    test('Send Telemetry', async () => {
        const eventName = 'Testing';
        const properties = { hello: 'world', foo: 'bar' };
        const measures = { start: 123, end: 987 };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendTelemetryEvent(eventName as any, measures, properties as any);

        // Fork note: telemetry was removed — sending must be a safe no-op that never reaches any reporter.
        await sleep(1);
        expect(Reporter.eventName).to.deep.equal([]);
    });
    test('Send Telemetry with no properties', async () => {
        const eventName = 'Testing';

        sendTelemetryEvent(eventName as any);

        // Fork note: telemetry was removed — sending must be a safe no-op.
        await sleep(1);
        expect(Reporter.eventName).to.deep.equal([]);
    });
    test('Send Telemetry with shared properties', async () => {
        const eventName = 'Testing';
        const properties = { hello: 'world', foo: 'bar' };
        const measures = { start: 123, end: 987 };
        setSharedProperty('one' as any, 'two' as any);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendTelemetryEvent(eventName as any, measures, properties as any);

        // Fork note: telemetry was removed — shared properties are ignored and nothing is sent.
        await sleep(1);
        expect(Reporter.eventName).to.deep.equal([]);
    });
    test('Shared properties will replace existing ones', async () => {
        const eventName = 'Testing';
        const properties = { hello: 'world', foo: 'bar' };
        const measures = { start: 123, end: 987 };
        setSharedProperty('foo' as any, 'baz' as any);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendTelemetryEvent(eventName as any, measures, properties as any);

        // Fork note: telemetry was removed — shared properties are ignored and nothing is sent.
        await sleep(1);
        expect(Reporter.eventName).to.deep.equal([]);
    });
    test('Send Error Telemetry', async () => {
        const error = new Error('Boo');

        const eventName = 'Testing';
        const properties = { hello: 'world', foo: 'bar' };
        const measures = { start: 123, end: 987 };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendTelemetryEvent(eventName as any, measures, properties as any, error);
        await sleep(1);

        // Fork note: telemetry was removed — error reporting must be a safe no-op.
        expect(Reporter.eventName).to.deep.equal([]);
    });
test('Send Error Telemetry with stack trace', async () => {
        // Fork note: the upstream stack-trace sanitization assertions are not applicable —
        // telemetry was removed in this fork, so error reporting is a safe no-op.
        const error = new Error('Boo');

        const eventName = 'Testing';
        const properties = { hello: 'world', foo: 'bar' };
        const measures = { start: 123, end: 987 };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendTelemetryEvent(eventName as any, measures, properties as any, error);
        await sleep(1);

        expect(Reporter.eventName).to.deep.equal([]);
    });
});
