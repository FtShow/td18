import {todolistsAPI, TodolistType} from "api/todolists-api";
import {appActions, RequestStatusType} from "app/app.reducer";
import {handleServerNetworkError} from "utils/handleServerNetworkError";
import {AppThunk} from "app/store";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {clearTasksAndTodolists} from "common/actions/common.actions";
import {createAppAsyncThunk} from "utils";

const initialState: TodolistDomainType[] = [];

const slice = createSlice({
    name: "todo",
    initialState,
    reducers: {
        changeTodolistTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
            const todo = state.find((todo) => todo.id === action.payload.id);
            if (todo) {
                todo.title = action.payload.title;
            }
        },
        changeTodolistFilter: (state, action: PayloadAction<{ id: string; filter: FilterValuesType }>) => {
            const todo = state.find((todo) => todo.id === action.payload.id);
            if (todo) {
                todo.filter = action.payload.filter;
            }
        },
        changeTodolistEntityStatus: (state, action: PayloadAction<{ id: string; entityStatus: RequestStatusType }>) => {
            const todo = state.find((todo) => todo.id === action.payload.id);
            if (todo) {
                todo.entityStatus = action.payload.entityStatus;
            }
        },
        setTodolists: (state, action: PayloadAction<{ todolists: TodolistType[] }>) => {
            return action.payload.todolists.map((tl) => ({...tl, filter: "all", entityStatus: "idle"}));
            // return action.payload.forEach(t => ({...t, filter: 'active', entityStatus: 'idle'}))
        },
    },
    extraReducers: (builder) => {
        builder.addCase(clearTasksAndTodolists, () => {
            return [];
        })
            .addCase(removeTodolist.fulfilled, (state, action) => {
                const index = state.findIndex((todo) => todo.id === action.payload.id);
                if (index !== -1) state.splice(index, 1);
            })
            .addCase(addTodolist.fulfilled, (state, action) => {
                const newTodolist: TodolistDomainType = {...action.payload.todolist, filter: "all", entityStatus: "idle"};
                state.unshift(newTodolist);
            })
    },
});


// thunks
export const fetchTodolists = createAppAsyncThunk(`${slice.name}/fetchTodolists`, async (arg, thunkAPI) => {
    const {dispatch, getState, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({ status: "loading" }));
        const res = await todolistsAPI.getTodolists();
        dispatch(appActions.setAppStatus({ status: "succeeded" }));
        return { todolists: res.data };

    } catch (error: any) {
        handleServerNetworkError(error, dispatch);
        return rejectWithValue(null)
    }
})

export const removeTodolist = createAppAsyncThunk<{ id: string }, { id: string }>
(`${slice.name}/removeTodolist`, async (arg, thunkAPI) => {
    const {dispatch, getState, rejectWithValue} = thunkAPI

    try {
        dispatch(appActions.setAppStatus({status: "loading"}));
        dispatch(todolistsActions.changeTodolistEntityStatus({id: arg.id, entityStatus: 'loading'}));
        const res = await todolistsAPI.deleteTodolist(arg.id)
        dispatch(appActions.setAppStatus({status: "succeeded"}));
        return {id: arg.id}

    } catch (error: any) {
        handleServerNetworkError(error, dispatch);
        return rejectWithValue(null)
    }
    //изменим глобальный статус приложения, чтобы вверху полоса побежала

})
export const addTodolist = createAppAsyncThunk<any, {
    title: string
}>(`${slice.name}/addTodolist`, async (arg, thunkAPI) => {

    const {dispatch, getState, rejectWithValue} = thunkAPI

    try {
        dispatch(appActions.setAppStatus({status: "loading"}));
        const res = await todolistsAPI.createTodolist(arg.title)
        //dispatch(todolistsActions.addTodolist({todolist: res.data.data.item}));
        dispatch(appActions.setAppStatus({status: "succeeded"}));
        return {todolist: res.data.data.item}
    } catch (error) {

    }
})
// export const addTodolistTC = (title: string): AppThunk => {
//     return (dispatch) => {
//         dispatch(appActions.setAppStatus({status: "loading"}));
//         todolistsAPI.createTodolist(title).then((res) => {
//             dispatch(todolistsActions.addTodolist({todolist: res.data.data.item}));
//             dispatch(appActions.setAppStatus({status: "succeeded"}));
//         });
//     };
// };
export const changeTodolistTitleTC = (id: string, title: string): AppThunk => {
    return (dispatch) => {
        todolistsAPI.updateTodolist(id, title).then((res) => {
            dispatch(todolistsActions.changeTodolistTitle({id, title}));
        });
    };
};

// types
export type FilterValuesType = "all" | "active" | "completed";
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType;
    entityStatus: RequestStatusType;
};

export const todolistsReducer = slice.reducer;
export const todolistsActions = slice.actions;

export const todolistThunk = {removeTodolist, fetchTodolists, addTodolist}