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

import AddIcon from '@material-ui/icons/Add';
import CollapseIcon from '@material-ui/icons/UnfoldLess';
import ExpandIcon from '@material-ui/icons/UnfoldMore';
import { QUERY_PARAMS, RoutePage } from '../components/Router';
import { ToolbarActionMap } from '../components/Toolbar';
import { PageProps } from '../pages/Page';
import { Apis } from './Apis';
import { URLParser } from './URLParser';
import { errorToMessage, s } from './Utils';
import i18next from 'i18next';

export enum ButtonKeys {
  ARCHIVE = 'archive',
  CLONE_RUN = 'cloneRun',
  CLONE_RECURRING_RUN = 'cloneRecurringRun',
  RETRY = 'retry',
  COLLAPSE = 'collapse',
  COMPARE = 'compare',
  DELETE_RUN = 'deleteRun',
  DISABLE_RECURRING_RUN = 'disableRecurringRun',
  ENABLE_RECURRING_RUN = 'enableRecurringRun',
  EXPAND = 'expand',
  NEW_EXPERIMENT = 'newExperiment',
  NEW_PIPELINE_VERSION = 'newPipelineVersion',
  NEW_RUN = 'newRun',
  NEW_RECURRING_RUN = 'newRecurringRun',
  NEW_RUN_FROM_PIPELINE_VERSION = 'newRunFromPipelineVersion',
  REFRESH = 'refresh',
  RESTORE = 'restore',
  TERMINATE_RUN = 'terminateRun',
  UPLOAD_PIPELINE = 'uploadPipeline',
}

export default class Buttons {
  private _map: ToolbarActionMap;
  private _props: PageProps;
  private _refresh: () => void;
  private _urlParser: URLParser;

  constructor(pageProps: PageProps, refresh: () => void, map?: ToolbarActionMap) {
    this._props = pageProps;
    this._refresh = refresh;
    this._urlParser = new URLParser(pageProps);
    this._map = map || {};
  }

  public getToolbarActionMap(): ToolbarActionMap {
    return this._map;
  }

  public archive(
    resourceName: 'run' | 'experiment',
    getSelectedIds: () => string[],
    useCurrentResource: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): Buttons {
    this._map[ButtonKeys.ARCHIVE] = {
      action: () =>
        resourceName === 'run'
          ? this._archiveRun(getSelectedIds(), useCurrentResource, callback)
          : this._archiveExperiments(getSelectedIds(), useCurrentResource, callback),
      disabled: !useCurrentResource,
      disabledTitle: useCurrentResource ? undefined : i18next.t('common:selectResourceArchive'),
      id: 'archiveBtn',
      title: i18next.t('common:archive'),
      tooltip: i18next.t('common:archive'),
    };
    return this;
  }

  public cloneRun(getSelectedIds: () => string[], useCurrentResource: boolean): Buttons {
    this._map[ButtonKeys.CLONE_RUN] = {
      action: () => this._cloneRun(getSelectedIds()),
      disabled: !useCurrentResource,
      disabledTitle: useCurrentResource ? undefined : i18next.t('common:selectRunClone'),
      id: 'cloneBtn',
      style: { minWidth: 100 },
      title: i18next.t('common:cloneRun'),
      tooltip: i18next.t('common:copyRunInitialState'),
    };
    return this;
  }

  public cloneRecurringRun(getSelectedIds: () => string[], useCurrentResource: boolean): Buttons {
    this._map[ButtonKeys.CLONE_RECURRING_RUN] = {
      action: () => this._cloneRun(getSelectedIds(), true),
      disabled: !useCurrentResource,
      disabledTitle: useCurrentResource ? undefined : i18next.t('common:selectRecurRunClone'),
      id: 'cloneBtn',
      title: i18next.t('common:cloneRecurRun'),
      tooltip: i18next.t('common:copyRunInitialState'),
    };
    return this;
  }

  public retryRun(
    getSelectedIds: () => string[],
    useCurrentResource: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): Buttons {
    this._map[ButtonKeys.RETRY] = {
      action: () => this._retryRun(getSelectedIds(), useCurrentResource, callback),
      disabled: !useCurrentResource,
      disabledTitle: useCurrentResource ? undefined : i18next.t('common:selectResourceRetry'),
      id: 'retryBtn',
      title: i18next.t('common:retry'),
      tooltip: i18next.t('common:retry'),
    };
    return this;
  }

  public collapseSections(action: () => void): Buttons {
    this._map[ButtonKeys.COLLAPSE] = {
      action,
      icon: CollapseIcon,
      id: 'collapseBtn',
      title: i18next.t('common:collapseAll'),
      tooltip: i18next.t('common:collapseAllSec'),
    };
    return this;
  }

  public compareRuns(getSelectedIds: () => string[]): Buttons {
    this._map[ButtonKeys.COMPARE] = {
      action: () => this._compareRuns(getSelectedIds()),
      disabled: true,
      disabledTitle: i18next.t('common:selectRunsCompare'),
      id: 'compareBtn',
      style: { minWidth: 125 },
      title: i18next.t('common:compareRuns'),
      tooltip: i18next.t('common:compareUpToTenRuns'),
    };
    return this;
  }

  // Delete resources of the same type, which can be pipeline, pipeline version,
  // or recurring run config.
  public delete(
    getSelectedIds: () => string[],
    resourceName: 'pipeline' | 'recurring run config' | 'pipeline version' | 'run',
    callback: (selectedIds: string[], success: boolean) => void,
    useCurrentResource: boolean,
  ): Buttons {
    this._map[ButtonKeys.DELETE_RUN] = {
      action: () =>
        resourceName === 'pipeline'
          ? this._deletePipeline(getSelectedIds(), useCurrentResource, callback)
          : resourceName === 'pipeline version'
          ? this._deletePipelineVersion(getSelectedIds(), useCurrentResource, callback)
          : resourceName === 'run'
          ? this._deleteRun(getSelectedIds(), useCurrentResource, callback)
          : this._deleteRecurringRun(getSelectedIds()[0], useCurrentResource, callback),
      disabled: !useCurrentResource,
      disabledTitle: useCurrentResource
        ? undefined
        : `${i18next.t('common:selectOne')} ${resourceName} ${i18next.t('common:toDelete')}`,
      id: 'deleteBtn',
      title: i18next.t('common:delete'),
      tooltip: i18next.t('common:delete'),
    };
    return this;
  }

  // Delete pipelines and pipeline versions simultaneously.
  public deletePipelinesAndPipelineVersions(
    getSelectedIds: () => string[],
    getSelectedVersionIds: () => { [pipelineId: string]: string[] },
    callback: (pipelineId: string | undefined, selectedIds: string[]) => void,
    useCurrentResource: boolean,
  ): Buttons {
    this._map[ButtonKeys.DELETE_RUN] = {
      action: () => {
        this._dialogDeletePipelinesAndPipelineVersions(
          getSelectedIds(),
          getSelectedVersionIds(),
          callback,
        );
      },
      disabled: !useCurrentResource,
      disabledTitle: useCurrentResource ? undefined : `${i18next.t('common:selectPipelineDelete')}`,
      id: 'deletePipelinesAndPipelineVersionsBtn',
      title: i18next.t('common:delete'),
      tooltip: i18next.t('common:delete'),
    };
    return this;
  }

  public disableRecurringRun(getId: () => string): Buttons {
    this._map[ButtonKeys.DISABLE_RECURRING_RUN] = {
      action: () => this._setRecurringRunEnabledState(getId(), false),
      disabled: true,
      disabledTitle: i18next.t('common:runSchedDisabled'),
      id: 'disableBtn',
      title: i18next.t('common:disable'),
      tooltip: i18next.t('common:disableRunsTrigger'),
    };
    return this;
  }

  public enableRecurringRun(getId: () => string): Buttons {
    this._map[ButtonKeys.ENABLE_RECURRING_RUN] = {
      action: () => this._setRecurringRunEnabledState(getId(), true),
      disabled: true,
      disabledTitle: i18next.t('common:runSchedEnabled'),
      id: 'enableBtn',
      title: i18next.t('common:enable'),
      tooltip: i18next.t('common:enableRunsTrigger'),
    };
    return this;
  }

  public expandSections(action: () => void): Buttons {
    this._map[ButtonKeys.EXPAND] = {
      action,
      icon: ExpandIcon,
      id: 'expandBtn',
      title: i18next.t('common:expandAll'),
      tooltip: i18next.t('common:expandAllSections'),
    };
    return this;
  }

  public newExperiment(getPipelineId?: () => string): Buttons {
    this._map[ButtonKeys.NEW_EXPERIMENT] = {
      action: () => this._createNewExperiment(getPipelineId ? getPipelineId() : ''),
      icon: AddIcon,
      id: 'newExperimentBtn',
      outlined: true,
      style: { minWidth: 185 },
      title: i18next.t('common:createExperiment'),
      tooltip: i18next.t('common:createNewExperiment'),
    };
    return this;
  }

  public newRun(getExperimentId?: () => string): Buttons {
    this._map[ButtonKeys.NEW_RUN] = {
      action: () => this._createNewRun(false, getExperimentId ? getExperimentId() : undefined),
      icon: AddIcon,
      id: 'createNewRunBtn',
      outlined: true,
      primary: true,
      style: { minWidth: 130 },
      title: i18next.t('common:createRun'),
      tooltip: i18next.t('common:createNewRun'),
    };
    return this;
  }

  public newRunFromPipelineVersion(
    getPipelineId: () => string,
    getPipelineVersionId: () => string,
  ): Buttons {
    this._map[ButtonKeys.NEW_RUN_FROM_PIPELINE_VERSION] = {
      action: () => this._createNewRunFromPipelineVersion(getPipelineId(), getPipelineVersionId()),
      icon: AddIcon,
      id: 'createNewRunBtn',
      outlined: true,
      primary: true,
      style: { minWidth: 130 },
      title: i18next.t('common:createRun'),
      tooltip: i18next.t('common:createNewRun'),
    };
    return this;
  }

  public newRecurringRun(experimentId: string): Buttons {
    this._map[ButtonKeys.NEW_RECURRING_RUN] = {
      action: () => this._createNewRun(true, experimentId),
      icon: AddIcon,
      id: 'createNewRecurringRunBtn',
      outlined: true,
      style: { minWidth: 195 },
      title: i18next.t('common:createRecurRun'),
      tooltip: i18next.t('common:createNewRecurRun'),
    };
    return this;
  }

  public newPipelineVersion(label: string, getPipelineId?: () => string): Buttons {
    this._map[ButtonKeys.NEW_PIPELINE_VERSION] = {
      action: () => this._createNewPipelineVersion(getPipelineId ? getPipelineId() : ''),
      icon: AddIcon,
      id: 'createPipelineVersionBtn',
      outlined: true,
      style: { minWidth: 160 },
      title: label,
      tooltip: i18next.t('common:uploadPipelineVersion'),
    };
    return this;
  }

  public refresh(action: () => void): Buttons {
    this._map[ButtonKeys.REFRESH] = {
      action,
      id: 'refreshBtn',
      title: i18next.t('common:refresh'),
      tooltip: i18next.t('common:refreshList'),
    };
    return this;
  }

  public restore(
    resourceName: 'run' | 'experiment',
    getSelectedIds: () => string[],
    useCurrentResource: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): Buttons {
    this._map[ButtonKeys.RESTORE] = {
      action: () =>
        resourceName === 'run'
          ? this._restore(getSelectedIds(), useCurrentResource, callback)
          : this._restoreExperiments(getSelectedIds(), useCurrentResource, callback),
      disabled: !useCurrentResource,
      disabledTitle: useCurrentResource ? undefined : i18next.t('common:selectResourceRestore'),
      id: 'restoreBtn',
      title: i18next.t('common:restore'),
      tooltip: i18next.t('common:restore'),
    };
    return this;
  }

  public terminateRun(
    getSelectedIds: () => string[],
    useCurrentResource: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): Buttons {
    this._map[ButtonKeys.TERMINATE_RUN] = {
      action: () => this._terminateRun(getSelectedIds(), useCurrentResource, callback),
      disabled: !useCurrentResource,
      disabledTitle: useCurrentResource ? undefined : i18next.t('common:selectRunTerminate'),
      id: 'terminateRunBtn',
      title: i18next.t('common:terminate'),
      tooltip: i18next.t('common:terminateRun'),
    };
    return this;
  }

  public upload(action: () => void): Buttons {
    this._map[ButtonKeys.UPLOAD_PIPELINE] = {
      action,
      icon: AddIcon,
      id: 'uploadBtn',
      outlined: true,
      style: { minWidth: 160 },
      title: i18next.t('common:uploadPipeline'),
      tooltip: i18next.t('common:uploadPipeline'),
    };
    return this;
  }

  private _cloneRun(selectedIds: string[], isRecurring?: boolean): void {
    if (selectedIds.length === 1) {
      const runId = selectedIds[0];
      let searchTerms;
      if (isRecurring) {
        searchTerms = {
          [QUERY_PARAMS.cloneFromRecurringRun]: runId || '',
          [QUERY_PARAMS.isRecurring]: '1',
        };
      } else {
        searchTerms = { [QUERY_PARAMS.cloneFromRun]: runId || '' };
      }
      const searchString = this._urlParser.build(searchTerms);
      this._props.history.push(RoutePage.NEW_RUN + searchString);
    }
  }

  private _retryRun(
    selectedIds: string[],
    useCurrent: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): void {
    this._dialogActionHandler(
      selectedIds,
      i18next.t('common:retryRun'),
      useCurrent,
      id => Apis.runServiceApi.retryRun(id),
      callback,
      i18next.t('common:retry'),
      'run',
    );
  }

  private _archiveRun(
    selectedIds: string[],
    useCurrent: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): void {
    this._dialogActionHandler(
      selectedIds,
      ` ${i18next.t('experiments:runs')} ${s(selectedIds)} ${i18next.t('executions:archiveRun')} ` +
        `${
          selectedIds.length === 1 ? i18next.t('experiments:its'):i18next.t('experiments:their')
        } ${i18next.t('executions:runArchiveText')}` +
        `${i18next.t('executions:runArchiveTextSuite')} ` +
        `${i18next.t('experiments:runs')}${s(selectedIds)} ${i18next.t('experiments:to')} ${selectedIds.length === 1 ? i18next.t('experiments:its'):i18next.t('experiments:their')} ${i18next.t('experiments:originalLocation')}`,
      useCurrent,
      id => Apis.runServiceApi.archiveRun(id),
      callback,
      i18next.t('common:archive'),
      'run',
    );
  }

  private _restore(
    selectedIds: string[],
    useCurrent: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): void {
    this._dialogActionHandler(
      selectedIds,
      `${i18next.t('executions:restore')} ${
        selectedIds.length === 1 ? i18next.t('executions:thisRunToIts'):i18next.t('executions:theseRunsToTheir')
      } ${i18next.t('executions:originalLocation')}`,
      useCurrent,
      id => Apis.runServiceApi.unarchiveRun(id),
      callback,
      i18next.t('common:restore'),
      'run',
    );
  }

  private _restoreExperiments(
    selectedIds: string[],
    useCurrent: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): void {
    this._dialogActionHandler(
      selectedIds,
      
      `${i18next.t('executions:restore')}${
        selectedIds.length === 1 ? i18next.t('experiments:thisExperimentToIts') : i18next.t('experiments:thisExperimentToTheir') 
      } ${i18next.t('experiments:RestoreExperimentText')}${
        selectedIds.length === 1 ? i18next.t('experiments:thisxperiment') : i18next.t('experiments:theseExperiments')
      } ${i18next.t('experiments:ExperimentTextsuite')} ${
        selectedIds.length === 1 ? i18next.t('experiments:thisxperiment'): i18next.t('experiments:theseExperiments')
      } ${i18next.t('experiments:WillbeMovedTo')}${selectedIds.length === 1 ? i18next.t('experiments:its') : i18next.t('experiments:their')} ${i18next.t('experiments:originalLocation')}${s(
        selectedIds,
      )}.`,
      useCurrent,
      id => Apis.experimentServiceApi.unarchiveExperiment(id),
      callback,
      i18next.t('common:restore'),
      'experiment',
    );
  }

  private _deletePipeline(
    selectedIds: string[],
    useCurrentResource: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): void {
    this._dialogActionHandler(
      selectedIds,
      `${i18next.t('pipelines:deletePipeline')} ${
        selectedIds.length === 1 ? i18next.t('pipelines:thisPipeline') :i18next.t('pipelines:thesePipelines') 
      }${i18next.t('pipelines:cannotBeDone')} `,
      useCurrentResource,
      id => Apis.pipelineServiceApi.deletePipeline(id),
      callback,
      i18next.t('common:delete'),
      'pipeline',
    );
  }

  private _deletePipelineVersion(
    selectedIds: string[],
    useCurrentResource: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): void {
    this._dialogActionHandler(
      selectedIds,
      `${i18next.t('pipelines:deletePipeline')} ${
        selectedIds.length === 1 ? i18next.t('pipelines:thisPipelineVersion')  : i18next.t('pipelines:thesePipelinesVersion') 
      }${i18next.t('pipelines:cannotBeDone')} `,
      useCurrentResource,
      id => Apis.pipelineServiceApi.deletePipelineVersion(id),
      callback,
      i18next.t('common:delete'),
      'pipeline version',
    );
  }

  private _deleteRecurringRun(
    id: string,
    useCurrentResource: boolean,
    callback: (_: string[], success: boolean) => void,
  ): void {
    this._dialogActionHandler(
      [id],
      i18next.t('common:terminateRecurRunConfig'),
      useCurrentResource,
      jobId => Apis.jobServiceApi.deleteJob(jobId),
      callback,
      i18next.t('common:delete'),
      'recurring run config',
    );
  }

  private _terminateRun(
    ids: string[],
    useCurrentResource: boolean,
    callback: (_: string[], success: boolean) => void,
  ): void {
    this._dialogActionHandler(
      ids,
      i18next.t('pipelines:terminateRun') + i18next.t('pipelines:terminateRunSuite'),
      useCurrentResource,
      id => Apis.runServiceApi.terminateRun(id),
      callback,
      i18next.t('common:terminate'),
      'run',
    );
  }

  private _deleteRun(
    ids: string[],
    useCurrentResource: boolean,
    callback: (_: string[], success: boolean) => void,
  ): void {
    this._dialogActionHandler(
      ids,
      i18next.t('common:deleteSelectedRuns'),
      useCurrentResource,
      id => Apis.runServiceApi.deleteRun(id),
      callback,
      i18next.t('common:delete'),
      'run',
    );
  }

  private _dialogActionHandler(
    selectedIds: string[],
    content: string,
    useCurrentResource: boolean,
    api: (id: string) => Promise<void>,
    callback: (selectedIds: string[], success: boolean) => void,
    actionName: string,
    resourceName: string,
  ): void {
    const dialogClosedHandler = (confirmed: boolean) =>
      this._dialogClosed(
        confirmed,
        selectedIds,
        actionName,
        resourceName,
        useCurrentResource,
        api,
        callback,
      );

    this._props.updateDialog({
      buttons: [
        {
          onClick: async () => await dialogClosedHandler(false),
          text: i18next.t('common:cancel'),
        },
        {
          onClick: async () => await dialogClosedHandler(true),
          text: actionName,
        },
      ],
      content,
      onClose: async () => await dialogClosedHandler(false),
      title: `${actionName} ${useCurrentResource ? 'this' : selectedIds.length} ${resourceName}${
        useCurrentResource ? '' : s(selectedIds.length)
      }?`,
    });
  }

  private async _dialogClosed(
    confirmed: boolean,
    selectedIds: string[],
    actionName: string,
    resourceName: string,
    useCurrentResource: boolean,
    api: (id: string) => Promise<void>,
    callback: (selectedIds: string[], success: boolean) => void,
  ): Promise<void> {
    if (confirmed) {
      const unsuccessfulIds: string[] = [];
      const errorMessages: string[] = [];
      await Promise.all(
        selectedIds.map(async id => {
          try {
            await api(id);
          } catch (err) {
            unsuccessfulIds.push(id);
            const errorMessage = await errorToMessage(err);
            errorMessages.push(
              `${i18next.t(
                'common:failedTo',
              )} ${actionName.toLowerCase()} ${resourceName}: ${id} ${i18next.t(
                'common:withError',
              )}: "${errorMessage}"`,
            );
          }
        }),
      );

      const successfulOps = selectedIds.length - unsuccessfulIds.length;
      if (successfulOps > 0) {
        this._props.updateSnackbar({
          message: `${actionName} ${i18next.t('common:succeededFor')} ${
            useCurrentResource ? i18next.t('common:this') : successfulOps
          } ${resourceName}${useCurrentResource ? '' : s(successfulOps)}`,
          open: true,
        });
        if (!useCurrentResource) {
          this._refresh();
        }
      }

      if (unsuccessfulIds.length > 0) {
        this._props.updateDialog({
          buttons: [{ text: i18next.t('common:dismiss') }],
          content: errorMessages.join('\n\n'),
          title: `${i18next.t('common:failedTo')} ${actionName.toLowerCase()} ${
            useCurrentResource ? '' : unsuccessfulIds.length + ' '
          }${resourceName}${useCurrentResource ? '' : s(unsuccessfulIds)}`,
        });
      }

      callback(unsuccessfulIds, !unsuccessfulIds.length);
    }
  }
  private _compareRuns(selectedIds: string[]): void {
    const indices = selectedIds;
    if (indices.length > 1 && indices.length <= 10) {
      const runIds = selectedIds.join(',');
      const searchString = this._urlParser.build({ [QUERY_PARAMS.runlist]: runIds });
      this._props.history.push(RoutePage.COMPARE + searchString);
    }
  }

  private _createNewExperiment(pipelineId: string): void {
    const searchString = pipelineId
      ? this._urlParser.build({
          [QUERY_PARAMS.pipelineId]: pipelineId,
        })
      : '';
    this._props.history.push(RoutePage.NEW_EXPERIMENT + searchString);
  }

  private _createNewRun(isRecurring: boolean, experimentId?: string): void {
    const searchString = this._urlParser.build(
      Object.assign(
        { [QUERY_PARAMS.experimentId]: experimentId || '' },
        isRecurring ? { [QUERY_PARAMS.isRecurring]: '1' } : {},
      ),
    );
    this._props.history.push(RoutePage.NEW_RUN + searchString);
  }

  private _createNewRunFromPipelineVersion(pipelineId?: string, pipelineVersionId?: string): void {
    let searchString = '';
    const fromRunId = this._urlParser.get(QUERY_PARAMS.fromRunId);

    if (fromRunId) {
      searchString = this._urlParser.build(Object.assign({ [QUERY_PARAMS.fromRunId]: fromRunId }));
    } else {
      searchString = this._urlParser.build({
        [QUERY_PARAMS.pipelineId]: pipelineId || '',
        [QUERY_PARAMS.pipelineVersionId]: pipelineVersionId || '',
      });
    }

    this._props.history.push(RoutePage.NEW_RUN + searchString);
  }

  private async _setRecurringRunEnabledState(id: string, enabled: boolean): Promise<void> {
    if (id) {
      const toolbarActions = this._props.toolbarProps.actions;

      // TODO(rileyjbauer): make sure this is working as expected
      const buttonKey = enabled
        ? ButtonKeys.ENABLE_RECURRING_RUN
        : ButtonKeys.DISABLE_RECURRING_RUN;

      toolbarActions[buttonKey].busy = true;
      this._props.updateToolbar({ actions: toolbarActions });
      try {
        await (enabled ? Apis.jobServiceApi.enableJob(id) : Apis.jobServiceApi.disableJob(id));
        this._refresh();
      } catch (err) {
        const errorMessage = await errorToMessage(err);
        this._props.updateDialog({
          buttons: [{ text: i18next.t('common:dismiss') }],
          content: errorMessage,
          title: `${i18next.t('common:failedTo')} ${
            enabled ? i18next.t('common:enable') : i18next.t('common:disable')
          } ${i18next.t('common:recurringRun')}`,
        });
      } finally {
        toolbarActions[buttonKey].busy = false;
        this._props.updateToolbar({ actions: toolbarActions });
      }
    }
  }

  private _createNewPipelineVersion(pipelineId?: string): void {
    const searchString = pipelineId
      ? this._urlParser.build({
          [QUERY_PARAMS.pipelineId]: pipelineId,
        })
      : '';
    this._props.history.push(RoutePage.NEW_PIPELINE_VERSION + searchString);
  }

  private _dialogDeletePipelinesAndPipelineVersions(
    selectedIds: string[],
    selectedVersionIds: { [pipelineId: string]: string[] },
    callback: (pipelineId: string | undefined, selectedIds: string[]) => void,
  ): void {
    const numVersionIds = this._deepCountDictionary(selectedVersionIds);
    const pipelineMessage = this._nouns(
      selectedIds.length,
      `${i18next.t('common:pipeline')}`,
      `${i18next.t('common:pipelines')}`,
    );
    const pipelineVersionMessage = this._nouns(
      numVersionIds,
      `${i18next.t('common:pipelineVersion')}`,
      `${i18next.t('common:pipelineVersions')}`,
    );
    const andMessage = pipelineMessage !== `` && pipelineVersionMessage !== `` ? ` and ` : ``;
    this._props.updateDialog({
      buttons: [
        {
          onClick: async () =>
            await this._deletePipelinesAndPipelineVersions(
              false,
              selectedIds,
              selectedVersionIds,
              callback,
            ),
          text: i18next.t('common:cancel'),
        },
        {
          onClick: async () =>
            await this._deletePipelinesAndPipelineVersions(
              true,
              selectedIds,
              selectedVersionIds,
              callback,
            ),
          text: i18next.t('common:delete'),
        },
      ],
      onClose: async () =>
        await this._deletePipelinesAndPipelineVersions(
          false,
          selectedIds,
          selectedVersionIds,
          callback,
        ),
      title:
        `${i18next.t('common:delete')} ` + pipelineMessage + andMessage + pipelineVersionMessage + `?`,
    });
  }

  private async _deletePipelinesAndPipelineVersions(
    confirmed: boolean,
    selectedIds: string[],
    selectedVersionIds: { [pipelineId: string]: string[] },
    callback: (pipelineId: string | undefined, selectedIds: string[]) => void,
  ): Promise<void> {
    if (!confirmed) {
      return;
    }

    // Since confirmed, delete pipelines first and then pipeline versions from
    // (other) pipelines.

    // Delete pipelines.
    const succeededfulIds: Set<string> = new Set<string>(selectedIds);
    const unsuccessfulIds: string[] = [];
    const errorMessages: string[] = [];
    await Promise.all(
      selectedIds.map(async id => {
        try {
          await Apis.pipelineServiceApi.deletePipeline(id);
        } catch (err) {
          unsuccessfulIds.push(id);
          succeededfulIds.delete(id);
          const errorMessage = await errorToMessage(err);
          errorMessages.push(
            `${i18next.t('common:deletePipelineFailed')}: ${id} ${i18next.t(
              'common:withError',
            )}: "${errorMessage}"`,
          );
        }
      }),
    );

    // Remove successfully deleted pipelines from selectedVersionIds if exists.
    const toBeDeletedVersionIds = Object.fromEntries(
      Object.entries(selectedVersionIds).filter(
        ([pipelineId, _]) => !succeededfulIds.has(pipelineId),
      ),
    );

    // Delete pipeline versions.
    const unsuccessfulVersionIds: { [pipelineId: string]: string[] } = {};
    await Promise.all(
      // TODO: fix the no no return value bug
      // eslint-disable-next-line array-callback-return
      Object.keys(toBeDeletedVersionIds).map(pipelineId => {
        toBeDeletedVersionIds[pipelineId].map(async versionId => {
          try {
            unsuccessfulVersionIds[pipelineId] = [];
            await Apis.pipelineServiceApi.deletePipelineVersion(versionId);
          } catch (err) {
            unsuccessfulVersionIds[pipelineId].push(versionId);
            const errorMessage = await errorToMessage(err);
            errorMessages.push(
              `${i18next.t('common:deletePipelineVersionFailed')}: ${versionId} ${i18next.t(
                'common:withError',
              )}: "${errorMessage}"`,
            );
          }
        });
      }),
    );
    const selectedVersionIdsCt = this._deepCountDictionary(selectedVersionIds);
    const unsuccessfulVersionIdsCt = this._deepCountDictionary(unsuccessfulVersionIds);

    // Display successful and/or unsuccessful messages.
    const pipelineMessage = this._nouns(
      succeededfulIds.size,
      `${i18next.t('common:pipeline')}`,
      `${i18next.t('common:pipelines')}`,
    );
    const pipelineVersionMessage = this._nouns(
      selectedVersionIdsCt - unsuccessfulVersionIdsCt,
      `${i18next.t('common:pipelineVersion')}`,
      `${i18next.t('common:pipelineVersions')}`,
    );
    const andMessage =
      pipelineMessage !== `` && pipelineVersionMessage !== `` ? ` ${i18next.t('common:and')} ` : ``;
    if (pipelineMessage !== `` || pipelineVersionMessage !== ``) {
      this._props.updateSnackbar({
        message:
          `${i18next.t('common:deletionSucceeded')} ` +
          pipelineMessage +
          andMessage +
          pipelineVersionMessage,
        open: true,
      });
    }
    if (unsuccessfulIds.length > 0 || unsuccessfulVersionIdsCt > 0) {
      this._props.updateDialog({
        buttons: [{ text: i18next.t('common:dismiss') }],
        content: errorMessages.join('\n\n'),
        title: `${i18next.t('common:deleteSomePipelinesFailed')}`,
      });
    }

    // pipelines and pipeline versions that failed deletion will keep to be
    // checked.
    callback(undefined, unsuccessfulIds);
    Object.keys(selectedVersionIds).map(pipelineId =>
      callback(pipelineId, unsuccessfulVersionIds[pipelineId]),
    );

    // Refresh
    this._refresh();
  }

  private _nouns(count: number, singularNoun: string, pluralNoun: string): string {
    if (count <= 0) {
      return ``;
    } else if (count === 1) {
      return `${count} ` + singularNoun;
    } else {
      return `${count} ` + pluralNoun;
    }
  }

  private _deepCountDictionary(dict: { [pipelineId: string]: string[] }): number {
    return Object.keys(dict).reduce((count, pipelineId) => count + dict[pipelineId].length, 0);
  }

  private _archiveExperiments(
    selectedIds: string[],
    useCurrent: boolean,
    callback: (selectedIds: string[], success: boolean) => void,
  ): void {
    this._dialogActionHandler(
      selectedIds,
      `${i18next.t('experiments:experiments')}${s(selectedIds)} ${i18next.t('experiments:moveExperiments')}${
        selectedIds.length === 1 ? i18next.t('experiments:its'):i18next.t('experiments:their')} 
        ${i18next.t('experiments:experimentTextArchive')}  ${s(
        selectedIds,
      )} ${i18next.t('experiments:to')} ${selectedIds.length === 1 ? i18next.t('experiments:its') : i18next.t('experiments:their')} ${i18next.t('experiments:originalLocation')}`,
      useCurrent,
      id => Apis.experimentServiceApi.archiveExperiment(id),
      callback,
      i18next.t('common:archive'),
      'experiment',
    );
  }
}