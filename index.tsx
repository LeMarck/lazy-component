import { ComponentType, memo, useEffect, useState } from 'react';
import { LocationDescriptor, Location, LocationState } from 'history';
import { Redirect, useLocation, useParams } from 'react-router';

type TProps = Record<string, unknown>;
type TParams = Record<string, string>;

interface LazyPageConfig {
  LoadingComponent: ComponentType;
  ErrorComponent: ComponentType<{ error: Error }>;
}

export type GetInitPropsContext<Params extends TParams, State = LocationState> = { params: Params } & Location<State>;
export type GetInitPropsResult<Props extends TProps> = { props: Props } | { redirect: LocationDescriptor };
export type GetInitialProps<Props extends TProps = TProps, Params extends TParams = TParams> =
  <State>(ctx: GetInitPropsContext<Params, State>) => Promise<GetInitPropsResult<Props>>;

export interface LazyPage<Props extends TProps, Params extends TParams = TParams> {
  default: ComponentType<Props>;
  getInitialProps?: GetInitialProps<Props, Params>;
}

enum LazyPageState {
  LOADING,
  SUCCESS,
  ERROR
}

type State<Props extends TProps> =
  | { state: LazyPageState.LOADING }
  | { state: LazyPageState.ERROR; error: Error }
  | { state: LazyPageState.SUCCESS; Component: ComponentType<Props> } & GetInitPropsResult<Props>;

export const createLazyPage = (config: LazyPageConfig) =>
  <Props extends TProps, Params extends TParams = TParams>(factory: () => Promise<LazyPage<Props, Params>>): ComponentType =>
    memo(() => {
      const [state, setDynamicState] = useState<State<Props>>({ state: LazyPageState.LOADING });
      const params = useParams<Params>();
      const location = useLocation<unknown>();

      useEffect(() => {
        (async function loading(): Promise<void> {
          try {
            const { default: Component, getInitialProps } = await factory();
            const props = getInitialProps
              ? await getInitialProps({ ...location, params })
              : { props: {} } as GetInitPropsResult<Props>;

            setDynamicState({ state: LazyPageState.SUCCESS, Component, ...props });
          } catch (error) {
            setDynamicState({ state: LazyPageState.ERROR, error });
          }
        }());
      }, [params, location]);

      if (state.state === LazyPageState.LOADING) return <config.LoadingComponent/>;
      if (state.state === LazyPageState.ERROR) return <config.ErrorComponent error={state.error}/>;
      if ('redirect' in state) return <Redirect to={state.redirect}/>;
      return <state.Component {...state.props}/>;
    });
