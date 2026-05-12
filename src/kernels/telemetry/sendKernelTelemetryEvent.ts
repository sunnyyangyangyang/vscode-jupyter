// Telemetry has been disabled

import type { Resource } from '../../platform/common/types';
import type { IEventNamePropertyMapping, TelemetryEventInfo } from '../../telemetry';
import type { ExcludeType, PickType, UnionToIntersection } from '../../platform/common/utils/misc';

export function sendKernelTelemetryEvent<P extends IEventNamePropertyMapping, E extends keyof P>(
    _resource: Resource,
    _eventName: E,
    _measures?:
        | (P[E] extends TelemetryEventInfo<infer R> ? Partial<PickType<UnionToIntersection<R>, number>> : undefined)
        | undefined,
    _properties?: P[E] extends TelemetryEventInfo<infer R>
        ? ExcludeType<R, number> extends never | undefined
            ? undefined
            : Partial<ExcludeType<R, number>>
        : undefined | undefined,
    _ex?: Error | undefined
) {
    // no-op: telemetry disabled
}
