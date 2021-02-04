/*
 * Copyright 2019 Google LLC
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

import i18next from 'i18next';
import Markdown from 'markdown-to-jsx';
import * as React from 'react';
import { classes, cssRaw } from 'typestyle';
import { ApiFilter, PredicateOp } from '../apis/filter/api';
import { AutoLink } from '../atoms/ExternalLink';
import { RoutePageFactory } from '../components/Router';
import { ToolbarProps } from '../components/Toolbar';
import SAMPLE_CONFIG from '../config/sample_config_from_backend.json';
import { commonCss, padding } from '../Css';
import { Apis } from '../lib/Apis';
import Buttons from '../lib/Buttons';
import { Page } from './Page';

const DEMO_PIPELINES: string[] = SAMPLE_CONFIG.slice(0, 4);
const DEMO_PIPELINES_ID_MAP = {
  control: 4,
  data: 3,
  tfxKeras: 2,
  tfx: 1,
  xgboost: 0,
};

const PAGE_CONTENT_MD = ({
  control,
  data,
  tfxKeras,
  tfx,
  xgboost,
}: {
  control: string;
  data: string;
  tfxKeras: string;
  tfx: string;
  xgboost: string;
}) => i18next.t('common:key1', {val: '$t(common:key2)'})+ '  \n ' +
i18next.t('common:key3', {val: '$t(common:key4)'})+   ' \n  '  +  
i18next.t('common:key5', {val: '$t(common:key6)'})+  ' \n  '  + 
i18next.t('common:key7', {val: '$t(common:key8)'})+  '   \n  '  +
i18next.t('common:key9', {val: '$t(common:key10)'})+ '   \n  '  +
i18next.t('common:key11', {val: '$t(common:key12)'})+ '   \n  '  +
i18next.t('common:key13', {val: '$t(common:key14)'})+ '   \n  '  +
i18next.t('common:key15', {val: '$t(common:key16)'})+ '   \n  '  +
i18next.t('common:key17', {val: '$t(common:key18)'})+ '   \n  '  +
i18next.t('common:key19', {val: '$t(common:key20)'})+ '   \n  '  +
i18next.t('common:key21', {val: '$t(common:key22)'})+ '   \n  '  +
i18next.t('common:key22', {val: '$t(common:key23)'})+ '   \n  '  +
i18next.t('common:key24', {val: '$t(common:key25)'})
cssRaw(`
.kfp-start-page li {
  font-size: 14px;
  margin-block-start: 0.83em;
  margin-block-end: 0.83em;
  margin-left: 2em;
}
.kfp-start-page p {
  font-size: 14px;
  margin-block-start: 0.83em;
  margin-block-end: 0.83em;
}
.kfp-start-page h2 {
  font-size: 18px;
  margin-block-start: 1em;
  margin-block-end: 1em;
}
.kfp-start-page h3 {
  font-size: 16px;
  margin-block-start: 1em;
  margin-block-end: 1em;
}
`);

const OPTIONS = {
  overrides: { a: { component: AutoLink } },
};

export class GettingStarted extends Page<{}, { links: string[] }> {
  public state = {
    links: ['', '', '', ''].map(getPipelineLink),
  };

  public getInitialToolbarState(): ToolbarProps {
    const buttons = new Buttons(this.props, this.refresh.bind(this));
    return {
      actions: buttons.getToolbarActionMap(),
      breadcrumbs: [],
      pageTitle: i18next.t('common:key27', {val: '$t(common:key28)'}),
    };
  }

  public async componentDidMount() {
    const ids = await Promise.all(
      DEMO_PIPELINES.map(name =>
        Apis.pipelineServiceApi
          .listPipelines(undefined, 10, undefined, createAndEncodeFilter(name))
          .then(pipelineList => {
            const pipelines = pipelineList.pipelines;
            if (pipelines?.length !== 1) {
              // This should be accurate, do not accept ambiguous results.
              return '';
            }
            return pipelines[0].id || '';
          })
          .catch(() => ''),
      ),
    );
    this.setState({ links: ids.map(getPipelineLink) });
  }

  public async refresh() {
    this.componentDidMount();
  }

  public render(): JSX.Element {
    return (
      <div className={classes(commonCss.page, padding(20, 'lr'), 'kfp-start-page')}>
        <Markdown options={OPTIONS}>
          {PAGE_CONTENT_MD({
            control: this.state.links[DEMO_PIPELINES_ID_MAP.control],
            data: this.state.links[DEMO_PIPELINES_ID_MAP.data],
            tfxKeras: this.state.links[DEMO_PIPELINES_ID_MAP.tfxKeras],
            tfx: this.state.links[DEMO_PIPELINES_ID_MAP.tfx],
            xgboost: this.state.links[DEMO_PIPELINES_ID_MAP.xgboost],
          })}
        </Markdown>
      </div>
    );
  }
}

function getPipelineLink(id: string) {
  if (!id) {
    return '#/pipelines';
  }
  return `#${RoutePageFactory.pipelineDetails(id)}`;
}

function createAndEncodeFilter(filterString: string): string {
  const filter: ApiFilter = {
    predicates: [
      {
        key: 'name',
        op: PredicateOp.EQUALS,
        string_value: filterString,
      },
    ],
  };
  return encodeURIComponent(JSON.stringify(filter));
}