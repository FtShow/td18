import React, {useCallback, useEffect} from "react";
import {useSelector} from "react-redux";
import {
    addTodolist,
    changeTodolistTitleTC,
    fetchTodolists,
    FilterValuesType,
    removeTodolist,
    todolistsActions, todolistThunk,
} from "features/TodolistsList/todolists.reducer";
import {removeTaskTC, tasksThunks, updateTask} from "features/TodolistsList/tasks.reducer";
import {TaskStatuses} from "api/todolists-api";
import {Grid, Paper} from "@mui/material";
import {AddItemForm} from "components/AddItemForm/AddItemForm";
import {Todolist} from "./Todolist/Todolist";
import {Navigate} from "react-router-dom";
import {useAppDispatch} from "hooks/useAppDispatch";
import {selectIsLoggedIn} from "features/auth/auth.selectors";
import {selectTasks} from "features/TodolistsList/tasks.selectors";
import {selectTodolists} from "features/TodolistsList/todolists.selectors";

type PropsType = {
    demo?: boolean;
};

export const TodolistsList: React.FC<PropsType> = ({demo = false}) => {
    const todolists = useSelector(selectTodolists);
    const tasks = useSelector(selectTasks);
    const isLoggedIn = useSelector(selectIsLoggedIn);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (demo || !isLoggedIn) {
            return;
        }
        dispatch(todolistThunk.fetchTodolists());
    }, []);

    const removeTask = useCallback(function (taskId: string, todolistId: string) {
        dispatch(removeTaskTC({taskId, todolistId}))
    }, []);

    const addTask = useCallback(function (title: string, todolistId: string) {
        dispatch(tasksThunks.addTask({title, todolistId}));
    }, []);

    const changeStatus = useCallback(function (taskId: string, status: TaskStatuses, todolistId: string) {

        dispatch(updateTask({taskId, domainModel: {status}, todolistId}));
    }, []);

    const changeTaskTitle = useCallback(function (taskId: string, newTitle: string, todolistId: string) {

        dispatch(tasksThunks.updateTask({taskId, domainModel: {title: newTitle}, todolistId}));
    }, []);

    const changeFilter = useCallback(function (filter: FilterValuesType, id: string) {
        dispatch(todolistsActions.changeTodolistFilter({id, filter}));
    }, []);

    const removeTodolist = useCallback(function (id: string) {
        dispatch(todolistThunk.removeTodolist({id}));
    }, []);

    const changeTodolistTitle = useCallback(function (id: string, title: string) {
        const thunk = changeTodolistTitleTC(id, title);
        dispatch(thunk);
    }, []);

    const addTodolist = useCallback(
        (title: string) => {

            dispatch(todolistThunk.addTodolist({title}));
        },
        [dispatch]
    );

    if (!isLoggedIn) {
        return <Navigate to={"/login"}/>;
    }

    return (
        <>
            <Grid container style={{padding: "20px"}}>
                <AddItemForm addItem={addTodolist}/>
            </Grid>
            <Grid container spacing={3}>
                {todolists.map((tl) => {
                    let allTodolistTasks = tasks[tl.id];

                    return (
                        <Grid item key={tl.id}>
                            <Paper style={{padding: "10px"}}>
                                <Todolist
                                    todolist={tl}
                                    tasks={allTodolistTasks}
                                    removeTask={removeTask}
                                    changeFilter={changeFilter}
                                    addTask={addTask}
                                    changeTaskStatus={changeStatus}
                                    removeTodolist={removeTodolist}
                                    changeTaskTitle={changeTaskTitle}
                                    changeTodolistTitle={changeTodolistTitle}
                                    demo={demo}
                                />
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </>
    );
};
