// Telemetry has been disabled

import { Uri } from 'vscode';
import { Resource } from '../common/types';
import { ResourceSpecificTelemetryProperties } from '../../telemetry';
import { getResourceType } from '../common/utils';
import { getComparisonKey } from '../vscode-path/resources';

type Context = {
    previouslySelectedKernelConnectionId: string;
};
export const trackedInfo = new Map<string, [ResourceSpecificTelemetryProperties, Context]>();
export const pythonEnvironmentsByHash = new Map<string, unknown>();

export function initializeGlobals(_interpreterPackageProvider: unknown) {
    // no-op: telemetry disabled
}

export function updatePythonPackages(
    _currentData: ResourceSpecificTelemetryProperties,
    _clonedCurrentData?: ResourceSpecificTelemetryProperties
) {
    // no-op: telemetry disabled
}

export function deleteTrackedInformation(resource: Uri) {
    trackedInfo.delete(getComparisonKey(resource));
}

export async function getContextualPropsForTelemetry(resource: Resource): Promise<ResourceSpecificTelemetryProperties> {
    if (!resource) {
        return {};
    }
    const data = trackedInfo.get(getComparisonKey(resource));
    const resourceType = getResourceType(resource);
    if (!data && resourceType) {
        return {
            resourceType
        };
    }
    if (!data) {
        return {};
    }
    const clonedData = JSON.parse(JSON.stringify(data[0]));
    return clonedData;
}
