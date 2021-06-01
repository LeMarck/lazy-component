import { LocationDescriptor, Location, LocationState } from 'history';
import { ComponentType, memo } from 'react';
import { Redirect, useLocation, useParams } from 'react-router';

export type GetInitPropsContext<Params = Record<string, unknown>, State = LocationState> = Location<State> & {
  params: Params;
};
export type GetInitPropsResult<Props> = { props: Props } | { redirect: LocationDescriptor };
export type GetInitialProps<Props = Record<string, unknown>, Params = Record<string, string>> =
  <State>(ctx: GetInitPropsContext<Params, State>) => Promise<GetInitPropsResult<Props>>;

export interface ILazyPage<Props, Params = Record<string, string>> {
  default: ComponentType<Props>;
  getInitialProps?: GetInitialProps<Props, Params>;
}

enum PageState {
  LOADING,
  SUCCESS,
  ERROR
}

type LazyPageState<Props> =
  | { state: PageState.LOADING }
  | { state: PageState.ERROR; error: unknown }
  | { state: PageState.SUCCESS; Component: ComponentType<Props> } & GetInitPropsResult<Props>;

/**
 * Ленивая загрузка страницы с предзагрузкой данных в getInitialProps
 * @param factory
 */
export function lazyPage<Props, Params = Record<string, string>>(
  factory: () => Promise<ILazyPage<Props, Params>>
): ComponentType {
  const stack: Array<LazyPageState<Props>> = [];

  return memo(function Page(): JSX.Element {
    const params = useParams<Params>() as Params;
    const location = useLocation();

    const state = stack.pop() || { state: PageState.LOADING };

    if (state.state === PageState.LOADING) {
      throw (async function loading(): Promise<void> {
        window.history.replaceState(undefined, document.title); // Чтобы стейт не сохранялся при перезагрузке

        try {
          const { default: Component, getInitialProps } = await factory();
          const props = getInitialProps ? await getInitialProps({ params, ...location }) : { props: {} };

          stack.push({ state: PageState.SUCCESS, Component, ...props as GetInitPropsResult<Props> });
        } catch (error: unknown) {
          const nextState: LazyPageState<Props> = { state: PageState.ERROR, error };
          stack.push(nextState, nextState); // При ошибках идёт двойной ререндер. Не занаю почему(((
        }
      }());
    }
    if (state.state === PageState.ERROR) throw state.error;
    if ('redirect' in state) return <Redirect to={state.redirect}/>;
    return <state.Component {...state.props}/>;
  });
}
