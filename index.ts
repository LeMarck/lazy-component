import { LocationDescriptor, Location, LocationState } from 'history';
import { ComponentType, createElement, memo } from 'react';
import { Redirect, useLocation, useParams } from 'react-router';

export type GetInitPropsContext<
  Params extends Record<string, string>,
  State extends LocationState = LocationState,
> = Location<State> & {
  params: Params;
};

export type GetInitPropsResult<Props> =
  | { props: Props }
  | { redirect: LocationDescriptor };

export type GetInitialProps<
  Props extends Record<string, unknown>,
  Params extends Record<string, string>,
> = <State>(
  ctx: GetInitPropsContext<Params, State>,
) => Promise<GetInitPropsResult<Props>>;

export interface ILazyPage<
  Props extends Record<string, unknown>,
  Params extends Record<string, string>,
> {
  default: ComponentType<Props>;
  getInitialProps?: GetInitialProps<Props, Params>;
}

type LazyPageState<Props extends Record<string, unknown>> =
  | { state: 'LOADING' }
  | { state: 'ERROR'; error: unknown }
  | ({
      state: 'SUCCESS';
      Component: ComponentType<Props>;
    } & GetInitPropsResult<Props>);

export function lazyPage<
  Props extends Record<string, unknown>,
  Params extends Record<string, string>,
>(factory: () => Promise<ILazyPage<Props, Params>>): ComponentType {
  const stack: Array<LazyPageState<Props>> = [];

  return memo(function Page(): JSX.Element {
    const params = useParams<Params>() as Params;
    const location = useLocation();
    const state = stack.pop() || { state: 'LOADING' };

    window.history.replaceState(undefined, document.title);

    if (state.state === 'LOADING') {
      throw (async function loading(): Promise<void> {
        try {
          const { default: Component, getInitialProps } = await factory();
          const props = getInitialProps
            ? await getInitialProps({ params, ...location })
            : { props: {} };

          stack.push({
            state: 'SUCCESS',
            Component,
            ...(props as GetInitPropsResult<Props>),
          });
        } catch (error: unknown) {
          const nextState: LazyPageState<Props> = {
            state: 'ERROR',
            error,
          };
          stack.push(nextState, nextState);
        }
      })();
    }
    if (state.state === 'ERROR') {
      throw state.error;
    }
    if ('redirect' in state) {
      return createElement(Redirect, { to: state.redirect });
    }
    return createElement(state.Component, state.props);
  });
}
