import {
    createTask,
    removeTask,
    TaskPriorities,
    TaskStatuses,
    TaskType,
    todolistsAPI,
    UpdateTaskModelType
} from "api/todolists-api";
import {AppThunk} from "app/store";
import {appActions} from "app/app.reducer";
import {todolistsActions, todolistThunk} from "features/TodolistsList/todolists.reducer";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {clearTasksAndTodolists} from "common/actions/common.actions";
import {createAppAsyncThunk, handleServerAppError, handleServerNetworkError} from "utils";


const initialState: TasksStateType = {};

const slice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTasksTC.fulfilled, (state, action) => {
                console.log('12121')
                state[action.payload.todolistId] = action.payload.tasks;
            })
            .addCase(addTask.fulfilled, (state, action) => {
                const tasks = state[action.payload.task.todoListId];
                tasks.unshift(action.payload.task);
            })
            .addCase(removeTaskTC.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId];
                const index = tasks.findIndex((t) => t.id === action.payload.taskId);
                if (index !== -1) tasks.splice(index, 1);
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId];
                const index = tasks.findIndex((t) => t.id === action.payload.taskId);
                if (index !== -1) {
                    tasks[index] = {...tasks[index], ...action.payload.domainModel};
                }
            })
            .addCase(fetchTasksTC.rejected, (state, action) => {
                debugger
            })
            .addCase(todolistThunk.addTodolist.fulfilled, (state, action) => {
                state[action.payload.todolist.id] = [];
            })
            .addCase(todolistThunk.removeTodolist.fulfilled, (state, action) => {
                delete state[action.payload.id];
            })
            .addCase(todolistsActions.setTodolists, (state, action) => {
                action.payload.todolists.forEach((tl) => {
                    state[tl.id] = [];
                });
            })
            .addCase(clearTasksAndTodolists, () => {
                return {};
            });
    },
});


const fetchTasksTC = createAppAsyncThunk<{
    tasks: TaskType[],
    todolistId: string
}, string>(`${slice.name}/fetchTasks`, async (todolistId, thunkAPI) => {
    const {dispatch, getState, rejectWithValue} = thunkAPI;
    try {
        dispatch(appActions.setAppStatus({status: "loading"}));
        const res = await todolistsAPI.getTasks(todolistId)
        const tasks = res.data.items;
        //dispatch(tasksActions.setTasks({tasks, todolistId}));
        dispatch(appActions.setAppStatus({status: "succeeded"}));
        return {tasks, todolistId}
    } catch (error: any) {
        handleServerNetworkError(error, dispatch);
        return rejectWithValue(null)
    }
});

enum ResultCode {
    success = 0,
    error = 1,
    catch = 10
}

const addTask = createAppAsyncThunk<{ task: TaskType }, createTask>(`${slice.name}/addTask`, async (arg, thunkAPI) => {
    const {dispatch, getState, rejectWithValue} = thunkAPI;
    try {
        dispatch(appActions.setAppStatus({status: "loading"}));
        const res = await todolistsAPI.createTask(arg)
        if (res.data.resultCode === ResultCode.success) {
            const task = res.data.data.item;
            //dispatch(tasksActions.addTask({task}));
            dispatch(appActions.setAppStatus({status: "succeeded"}));
            return {task}
        } else {
            handleServerAppError(res.data, dispatch);
            return rejectWithValue(null)
        }


    } catch (error: any) {
        handleServerNetworkError(error, dispatch);
        return rejectWithValue(null)
    }

})

export const removeTaskTC = createAppAsyncThunk<removeTask, removeTask >(`${slice.name}/removeTask`, async (arg, thunkAPI)=>{

    const {dispatch, getState, rejectWithValue} = thunkAPI;
    try {
        const res = await todolistsAPI.deleteTask(arg)
        return { taskId: arg.taskId, todolistId: arg.todolistId }
        //dispatch(tasksActions.removeTask({taskId, todolistId}));
    }catch (error){
        handleServerNetworkError(error, dispatch);
        return rejectWithValue(null)

    }

})


// export const _removeTaskTC =
//     (taskId: string, todolistId: string): AppThunk =>
//         (dispatch) => {
//             todolistsAPI.deleteTask(todolistId, taskId).then(() => {
//                 dispatch(tasksActions.removeTask({taskId, todolistId}));
//             });
//         };

export type updateTaskArg = {
    taskId: string,
    domainModel: UpdateDomainTaskModelType,
    todolistId: string
}
export const updateTask = createAppAsyncThunk<updateTaskArg, updateTaskArg>(`${slice.name}/updateTask`, async (arg, thunkAPI) => {
    const {dispatch, getState, rejectWithValue} = thunkAPI;

    try {
        const state = getState();
        const task = state.tasks[arg.todolistId].find((t) => t.id === arg.taskId);
        if (!task) {
            //throw new Error("task not found in the state");
            console.warn("task not found in the state");
            return rejectWithValue(null)
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...arg.domainModel,
        };

        const res = await todolistsAPI.updateTask(arg.todolistId, arg.taskId, apiModel)

        if (res.data.resultCode === 0) {
            return arg
        } else {
            handleServerAppError(res.data, dispatch);
            return rejectWithValue(null)
        }

    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})


// types
export type UpdateDomainTaskModelType = {
    title?: string;
    description?: string;
    status?: TaskStatuses;
    priority?: TaskPriorities;
    startDate?: string;
    deadline?: string;
};
export type TasksStateType = {
    [key: string]: Array<TaskType>;
};

export const tasksReducer = slice.reducer;
export const tasksActions = slice.actions;
export const tasksThunks = {fetchTasksTC, addTask, updateTask}
