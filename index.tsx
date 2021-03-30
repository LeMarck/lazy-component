import { ComponentType, memo, useEffect, useState } from 'react';
import { LocationDescriptor } from 'history';
import { Redirect, useParams } from 'react-router';

interface IConfigLazy {
    LoadingComponent: ComponentType;
    ErrorComponent: ComponentType<{ error: Error }>;
}

export type GetInitPropsResult<Props extends object> = { props: Props } | { redirect: LocationDescriptor };

export type GetInitialProps<Props extends object = object, Params extends object = object> =
    <State>(params: Params, state: State) => Promise<GetInitPropsResult<Props>>;

export interface ILazyComponent<Props extends object, Params extends object = object> {
    default: ComponentType<Props>;
    getInitialProps?: GetInitialProps<Props, Params>;
}

enum ComponentState {
    LOADING,
    SUCCESS,
    ERROR
}

type State<Props extends object> =
    | { state: ComponentState.LOADING }
    | { state: ComponentState.ERROR; error: Error }
    | { state: ComponentState.SUCCESS; Component: ComponentType<Props> } & GetInitPropsResult<Props>;

export const createLazy = (config: IConfigLazy) =>
    <Props extends object, Params extends object = object>(factory: () => Promise<ILazyComponent<Props, Params>>) =>
        memo(() => {
            const [state, setDynamicState] = useState<State<Props>>({ state: ComponentState.LOADING });
            const params = useParams<Params>();

            useEffect(() => {
                (async function loading(): Promise<void> {
                    try {
                        const { default: Component, getInitialProps } = await factory();
                        const props = getInitialProps
                            ? await getInitialProps(params, state)
                            : { props: {} } as GetInitPropsResult<Props>;

                        setDynamicState({ state: ComponentState.SUCCESS, Component, ...props });
                    } catch (error) {
                        setDynamicState({ state: ComponentState.ERROR, error });
                    }
                }());
            }, [params]);

            if (state.state === ComponentState.LOADING) return <config.LoadingComponent/>;
            if (state.state === ComponentState.ERROR) return <config.ErrorComponent error={state.error}/>;
            if ('redirect' in state) return <Redirect to={state.redirect}/>;
            return <state.Component {...state.props}/>;
        });
