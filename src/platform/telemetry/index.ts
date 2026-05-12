// Telemetry has been disabled - all functions are no-ops

import { ExcludeType, PickType, UnionToIntersection } from '../common/utils/misc';
import { TelemetryEventInfo, IEventNamePropertyMapping } from '../../telemetry';
import { type Disposable } from 'vscode';

export { JupyterCommands, Telemetry } from '../common/constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function isTelemetryDisabled(): boolean {
    return true;
}

export function onDidChangeTelemetryEnablement(_handler: (enabled: boolean) => void): Disposable {
    return { dispose: () => {} };
}

export function setSharedProperty<P extends SharedPropertyMapping, E extends keyof P>(_name: E, _value?: P[E]): void {
    // no-op: telemetry disabled
}

export function _resetSharedProperties(): void {
    // no-op: telemetry disabled
}

// Stub TelemetryReporter - all methods are no-ops
const noopReporter: {
    sendTelemetryEvent: (..._args: any[]) => void;
    sendDangerousTelemetryEvent: (..._args: any[]) => void;
    dispose: () => void;
} = {
    sendTelemetryEvent: () => {},
    sendDangerousTelemetryEvent: () => {},
    dispose: () => {}
};

export function getTelemetryReporter(): typeof noopReporter {
    return noopReporter;
}

export function sendTelemetryEvent<P extends IEventNamePropertyMapping, E extends keyof P>(
    _eventName: E,
    _measures?:
        | (P[E] extends TelemetryEventInfo<infer R> ? PickType<UnionToIntersection<R>, number> : undefined)
        | undefined,
    _properties?: P[E] extends TelemetryEventInfo<infer R>
        ? ExcludeType<R, number> extends never | undefined
            ? undefined
            : ExcludeType<R, number>
        : undefined | undefined,
    _ex?: Error
) {
    // no-op: telemetry disabled
}

export type TelemetryProperties<
    E extends keyof P,
    P extends IEventNamePropertyMapping = IEventNamePropertyMapping
> = P[E] extends TelemetryEventInfo<infer R>
    ? ExcludeType<R, number> extends never | undefined
        ? undefined
        : ExcludeType<R, number>
    : undefined | undefined;

export type TelemetryMeasures<
    E extends keyof P,
    P extends IEventNamePropertyMapping = IEventNamePropertyMapping
> = P[E] extends TelemetryEventInfo<infer R> ? PickType<UnionToIntersection<R>, number> : undefined;

// Type-parameterized form of MethodDecorator in lib.es5.d.ts.
type TypedMethodDescriptor<T> = (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;

export type PickTypeNumberProps<T, Value> = {
    [P in keyof T as T[P] extends Value ? P : never]: T[P];
};
export type PickPropertiesOnly<T> = {
    [P in keyof T as T[P] extends TelemetryEventInfo<infer R>
        ? keyof PickType<R, number> extends never
            ? never
            : P
        : never]: T[P];
};

/**
 * Decorator that does nothing - telemetry has been disabled.
 */
export function capturePerfTelemetry<This, P extends IEventNamePropertyMapping, E extends keyof PickPropertiesOnly<P>>(
    _eventName: E,
    _properties?: P[E] extends TelemetryEventInfo<infer R>
        ? ExcludeType<R, number> extends never | undefined
            ? undefined
            : ExcludeType<R, number>
        : undefined
): TypedMethodDescriptor<(this: This, ...args: any[]) => any> {
    return function (
        _target: Object,
        _propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<(this: This, ...args: any[]) => any>
    ) {
        // Return the original method unchanged - no telemetry wrapping
        return descriptor;
    };
}

/**
 * Decorator that does nothing - telemetry has been disabled.
 */
export function captureUsageTelemetry<This, P extends IEventNamePropertyMapping, E extends keyof P>(
    _eventName: E,
    _properties?: P[E] extends TelemetryEventInfo<infer R>
        ? ExcludeType<R, number> extends never | undefined
            ? undefined
            : ExcludeType<R, number>
        : undefined
): TypedMethodDescriptor<(this: This, ...args: any[]) => any> {
    return function (
        _target: Object,
        _propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<(this: This, ...args: any[]) => any>
    ) {
        // Return the original method unchanged - no telemetry wrapping
        return descriptor;
    };
}

/**
 * Shared properties type definition (kept for compatibility).
 */
export class SharedPropertyMapping {
    ['isInsiderExtension']: 'true' | 'false';
    ['rawKernelSupported']: 'true' | 'false';
    ['isPythonExtensionInstalled']: 'true' | 'false';
}
