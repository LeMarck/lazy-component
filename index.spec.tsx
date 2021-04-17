import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route } from 'react-router';
import { createLazyPage } from './index';

const LoadingComponent = (): JSX.Element =>
  <div data-testid={'LoadingComponent'}>Loading...</div>;
const ErrorComponent = ({ error }: { error: Error }): JSX.Element =>
  <div data-testid={'ErrorComponent'}>{error.message}</div>;
const ContentComponent = ({ message = 'DefaultMessage' }: { message: string }): JSX.Element =>
  <div data-testid={'ContentComponent'}>{message}</div>;

const lazyPage = createLazyPage({ LoadingComponent, ErrorComponent });

describe('LazyPage', () => {
  test('Should render the "ContentComponent" component with default message', async () => {
    const Component = lazyPage(() => Promise.resolve({ default: ContentComponent }));

    render(<Component/>, { wrapper: MemoryRouter });

    expect(screen.queryByTestId('LoadingComponent')).toBeInTheDocument();

    const contentComponent = await screen.findByTestId('ContentComponent');

    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent.textContent).toEqual('DefaultMessage');
  });

  test('Should render the "ContentComponent" component with custom message', async () => {
    const Component = lazyPage(() => Promise.resolve({
      default: ContentComponent,
      getInitialProps: async () => ({ props: { message: 'TestMessage' } })
    }));


    render(<Component/>, { wrapper: MemoryRouter });

    expect(screen.queryByTestId('LoadingComponent')).toBeInTheDocument();

    const contentComponent = await screen.findByTestId('ContentComponent');

    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent.textContent).toEqual('TestMessage');
  });

  test('Should render the "ErrorComponent" component with Error message', async () => {
    const Component = lazyPage(() => Promise.resolve({
      default: ContentComponent,
      getInitialProps: async () => {
        throw Error('TestError');
      }
    }));


    render(<Component/>, { wrapper: MemoryRouter });

    expect(screen.queryByTestId('LoadingComponent')).toBeInTheDocument();

    const errorComponent = await screen.findByTestId('ErrorComponent');

    expect(errorComponent).toBeInTheDocument();
    expect(errorComponent.textContent).toEqual('TestError');
  });

  test('Должен вызвать редирект на страницу /test', async () => {
    const Component = lazyPage(() => Promise.resolve({
      default: ContentComponent,
      getInitialProps: async () => ({ redirect: '/test' })
    }));


    render(<MemoryRouter>
      <Route path={'/'} exact component={Component}/>);
      <Route path={'/test'} exact render={() => <ContentComponent message={'RedirectMessage'}/>}/>
    </MemoryRouter>);

    expect(screen.queryByTestId('LoadingComponent')).toBeInTheDocument();

    const redirectComponent = await screen.findByTestId('ContentComponent');

    expect(redirectComponent).toBeInTheDocument();
    expect(redirectComponent.textContent).toEqual('RedirectMessage');
  });
});
