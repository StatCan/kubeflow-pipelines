import React, { FC } from 'react';
import { PodInfo, PodEvents } from './PodYaml';
import { render, act, fireEvent } from '@testing-library/react';
import { Apis } from 'src/lib/Apis';
import TestUtils from 'src/TestUtils';

let mockedValue = '';
jest.mock('i18next', () => ({ t: () => mockedValue }));
//jest.mock("i18next", () => ({ t: jest.fn(), }));
// Original ./Editor uses a complex external editor inside, we use a simple mock
// for testing instead.
jest.mock('./Editor', () => {
  return ({ value }: { value: string }) => <pre data-testid='Editor'>{value}</pre>;
});

afterEach(async () => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe('PodInfo', () => {
  let podInfoSpy: any;
  beforeEach(() => {
    podInfoSpy = jest.spyOn(Apis, 'getPodInfo');
  });

  it('renders Editor with pod yaml', async () => {
    podInfoSpy.mockImplementation(() =>
      Promise.resolve({
        kind: 'Pod',
        metadata: {
          name: 'test-pod',
        },
      }),
    );
    const { container } = render(<PodInfo name='test-pod' namespace='test-ns' />);
    // Renders nothing when loading
    expect(container).toMatchInlineSnapshot(`<div />`);

    await act(TestUtils.flushPromises);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <pre
          data-testid="Editor"
        >
          kind: Pod
      metadata:
        name: test-pod

        </pre>
      </div>
    `);
  });

  it('renders pod yaml putting spec to the last section', async () => {
    podInfoSpy.mockImplementation(() =>
      Promise.resolve({
        kind: 'Pod',
        spec: {
          property: 'value',
        },
        status: {
          property: 'value2',
        },
      }),
    );
    const { container } = render(<PodInfo name='test-pod' namespace='test-ns' />);
    await act(TestUtils.flushPromises);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <pre
          data-testid="Editor"
        >
          kind: Pod
      status:
        property: value2
      spec:
        property: value

        </pre>
      </div>
    `);
  });

  it('shows a warning banner when request fails', async () => {
    mockedValue = 'Failed to retrieve pod info.';
    podInfoSpy.mockImplementation(() => Promise.reject('Pod not found'));
    const { getAllByText } = render(<PodInfo name='test-pod' namespace='test-ns' />);
    await act(TestUtils.flushPromises);
    getAllByText('Failed to retrieve pod info.');
  });

  it('can be retried when request fails', async () => {
    // Network was bad initially
    mockedValue = 'Failed to retrieve pod info.';
    podInfoSpy.mockImplementation(() => Promise.reject('Network failed'));
    const { getAllByText } = render(<PodInfo name='test-pod' namespace='test-ns' />);
    await act(TestUtils.flushPromises);

    // Now network gets healthy
    podInfoSpy.mockImplementation(() =>
      Promise.resolve({
        kind: 'Pod',
      }),
    );
    const refreshButton = getAllByText('Failed to retrieve pod info.');
    fireEvent.click(refreshButton[0]);
    await act(TestUtils.flushPromises);
    getAllByText('Failed to retrieve pod info.');
  });

  it('refreshes automatically when pod name or namespace changes', async () => {
    // Now network gets healthy
    podInfoSpy.mockImplementation(() =>
      Promise.resolve({
        metadata: { name: 'pod-1' },
      }),
    );
    const { getByText, rerender } = render(<PodInfo name='test-pod-1' namespace='test-ns' />);
    expect(podInfoSpy).toHaveBeenLastCalledWith('test-pod-1', 'test-ns');
    await act(TestUtils.flushPromises);
    getByText(/pod-1/);

    podInfoSpy.mockImplementation(() =>
      Promise.resolve({
        metadata: { name: 'pod-2' },
      }),
    );
    rerender(<PodInfo name='test-pod-2' namespace='test-ns' />);
    expect(podInfoSpy).toHaveBeenLastCalledWith('test-pod-2', 'test-ns');
    await act(TestUtils.flushPromises);
    getByText(/pod-2/);
  });
});

// PodEvents is very similar to PodInfo, so we only test different parts here.
describe('PodEvents', () => {
  let podEventsSpy: any;
  beforeEach(() => {
    podEventsSpy = jest.spyOn(Apis, 'getPodEvents');
  });

  it('renders Editor with pod events yaml', async () => {
    podEventsSpy.mockImplementation(() =>
      Promise.resolve({
        kind: 'EventList',
      }),
    );
    const { container } = render(<PodEvents name='test-pod' namespace='test-ns' />);
    await act(TestUtils.flushPromises);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <pre
          data-testid="Editor"
        >
          kind: EventList

        </pre>
      </div>
    `);
  });

  it('shows a warning banner when request fails', async () => {
    mockedValue = 'Failed';
    podEventsSpy.mockImplementation(() => Promise.reject('Pod not found'));
    const { getAllByText } = render(<PodEvents name='test-pod' namespace='test-ns' />);
    await act(TestUtils.flushPromises);
    getAllByText('Failed');
  });
});
function getAllByText(arg0: string) {
  throw new Error('Function not implemented.');
}
