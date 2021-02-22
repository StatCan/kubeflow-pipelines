/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import ErrorIcon from '@material-ui/icons/Error';
import PendingIcon from '@material-ui/icons/Schedule';
import RunningIcon from '../icons/statusRunning';
import SkippedIcon from '@material-ui/icons/SkipNext';
import SuccessIcon from '@material-ui/icons/CheckCircle';
import CachedIcon from '@material-ui/icons/Cached';
import TerminatedIcon from '../icons/statusTerminated';
import Tooltip from '@material-ui/core/Tooltip';
import UnknownIcon from '@material-ui/icons/Help';
import { color } from '../Css';
import { logger, formatDateString } from '../lib/Utils';
import { NodePhase, checkIfTerminated } from '../lib/StatusUtils';
import i18n from '../i18n';

export function statusToIcon(
  status?: NodePhase,
  startDate?: Date | string,
  endDate?: Date | string,
  nodeMessage?: string,
): JSX.Element {
  status = checkIfTerminated(status, nodeMessage);
  // tslint:disable-next-line:variable-name
  let IconComponent: any = UnknownIcon;
  let iconColor = color.inactive;
  let title = i18n.t('common:unknownStatus');
  switch (status) {
    case NodePhase.ERROR:
      IconComponent = ErrorIcon;
      iconColor = color.errorText;
      title = i18n.t('common:errorRunResource');
      break;
    case NodePhase.FAILED:
      IconComponent = ErrorIcon;
      iconColor = color.errorText;
      title = i18n.t('common:executeResourceFailed');
      break;
    case NodePhase.PENDING:
      IconComponent = PendingIcon;
      iconColor = color.weak;
      title = i18n.t('common:executePending');
      break;
    case NodePhase.RUNNING:
      IconComponent = RunningIcon;
      iconColor = color.blue;
      title = i18n.t('common:running');
      break;
    case NodePhase.TERMINATING:
      IconComponent = RunningIcon;
      iconColor = color.blue;
      title = i18n.t('common:runTerminating');
      break;
    case NodePhase.SKIPPED:
      IconComponent = SkippedIcon;
      title = i18n.t('common:executionSkipped');
      break;
    case NodePhase.SUCCEEDED:
      IconComponent = SuccessIcon;
      iconColor = color.success;
      title = i18n.t('common:executionSuccess');
      break;
    case NodePhase.CACHED: // This is not argo native, only applies to node.
      IconComponent = CachedIcon;
      iconColor = color.success;
      title = i18n.t('common:executionSkippedCache');
      break;
    case NodePhase.TERMINATED:
      IconComponent = TerminatedIcon;
      iconColor = color.terminated;
      title = i18n.t('common:runManuallyTerminated');
      break;
    case NodePhase.UNKNOWN:
      break;
    default:
      logger.verbose(`${i18n.t('common:unknownNodePhase')}:`, status);
  }
  return (
    <Tooltip
      title={
        <div>
          <div>{title}</div>
          {/* These dates may actually be strings, not a Dates due to a bug in swagger's handling of dates */}
          {startDate && <div>{i18n.t('common:start')}: {formatDateString(startDate)}</div>}
          {endDate && <div>{i18n.t('common:end')}: {formatDateString(endDate)}</div>}
        </div>
      }
    >
      <span style={{ height: 18 }}>
        <IconComponent style={{ color: iconColor, height: 18, width: 18 }} />
      </span>
    </Tooltip>
  );
}