import { PureComponent, ReactNode, Suspense as ReactSuspense } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router';
import { lazyPage } from './index';

class Wrapper extends PureComponent<{ children: ReactNode }> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error): { error?: Error } {
    return { error };
  }

  render(): ReactNode {
    if (this.state.error) {
      return <div data-testid={'ErrorComponent'}>{this.state.error.message}</div>;
    }

    return <ReactSuspense fallback={<div data-testid={'LoadingComponent'}>Loading...</div>}>
      {this.props.children}
    </ReactSuspense>;
  }
}

const ContentComponent = ({ message = 'DefaultMessage' }: { message: string }): JSX.Element =>
  <div data-testid={'ContentComponent'}>{message}</div>;

describe('lazyPage', () => {
  let spy: jest.SpyInstance;

  beforeAll(() => {
    spy = jest.spyOn(console, 'error').mockImplementation(() => { /* */
    });
  });

  afterAll(() => {
    spy.mockRestore();
  });

  it('Should render the "ContentComponent" component with default message', async () => {
    const Component = lazyPage(() => Promise.resolve({ default: ContentComponent }));

    render(<Wrapper><Component/></Wrapper>, { wrapper: MemoryRouter });

    expect(screen.queryByTestId('LoadingComponent')).toBeInTheDocument();

    const contentComponent = await screen.findByTestId('ContentComponent');

    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent.textContent).toEqual('DefaultMessage');
  });

  it('Should render the "ContentComponent" component with custom message', async () => {
    const Component = lazyPage(() => Promise.resolve({
      default: ContentComponent,
      getInitialProps: async () => ({ props: { message: 'TestMessage' } })
    }));


    render(<Wrapper><Component/></Wrapper>, { wrapper: MemoryRouter });

    expect(screen.queryByTestId('LoadingComponent')).toBeInTheDocument();

    const contentComponent = await screen.findByTestId('ContentComponent');

    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent.textContent).toEqual('TestMessage');
  });

  test('Should render the "ErrorComponent" component with Error message', async () => {
    const Component = lazyPage(() => Promise.resolve({
      default: ContentComponent,
      getInitialProps: () => {
        throw Error('TestError');
      }
    }));


    render(<Wrapper><Component/></Wrapper>, { wrapper: MemoryRouter });

    expect(screen.queryByTestId('LoadingComponent')).toBeInTheDocument();

    const errorComponent = await screen.findByTestId('ErrorComponent');

    expect(errorComponent).toBeInTheDocument();
    expect(errorComponent.textContent).toEqual('TestError');
  });

  test('Should cause a redirect to the "/test" page', async () => {
    const Component = lazyPage(() => Promise.resolve({
      default: ContentComponent,
      getInitialProps: async () => ({ redirect: '/test' })
    }));


    render(
      <Wrapper>
        <Route path={'/'} exact component={Component}/>);
        <Route path={'/test'} exact render={() => <ContentComponent message={'RedirectMessage'}/>}/>
      </Wrapper>,
      { wrapper: MemoryRouter }
    );

    expect(screen.queryByTestId('LoadingComponent')).toBeInTheDocument();

    const redirectComponent = await screen.findByTestId('ContentComponent');

    expect(redirectComponent).toBeInTheDocument();
    expect(redirectComponent.textContent).toEqual('RedirectMessage');
  });
});
