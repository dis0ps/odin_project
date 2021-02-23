import styles from "./TodoEdit.local.scss";
import { Component } from "../Prototype/Component";
import * as app from "../../app/App";
import flatpickr from "flatpickr";
import { format, parseISO } from "date-fns";

class TodoEdit extends Component {
  private refPubSub: app.PubSub;
  private currentProject: app.Project;
  private currentTodo: app.TodoData;
  private isNewTodo: boolean;

  constructor(container: Element, pubsub: app.PubSub) {
    super(container);
    this.refPubSub = pubsub;
    this.currentTodo = app.Factory.createTodoTemplate();
    this.isNewTodo = true;

    this._bindHandler("click", this.handleClick.bind(this));

    this.refPubSub.subscribe(
      app.enumEventMessages.UPDATE_VIEWS,
      this.loadTodo.bind(this)
    );
  }

  private handleClick(e: Event) {
    if (e.target) {
      const targetClick = e.target as HTMLElement;
      switch (targetClick.id) {
        case "save-button":
          this.saveTodo();
          break;
        case "cancel-button":
          this.refPubSub.publish(app.enumEventMessages.SET_CURRENT_TODO, "");
          this.refPubSub.publish(app.enumEventMessages.CHANGE_VIEW_LIST, null);
      }
    }
  }

  private saveTodo() {
    const todoForm = <HTMLFormElement>(
      this.targetContainer.querySelector("#todo-form")
    );

    const formData = new FormData(todoForm);

    Object.keys(this.currentTodo).forEach((key) => {
      if (key !== "id" && key != "dueDate") {
        let targetElement = <HTMLFormElement>todoForm.querySelector(`#${key}`);
        this.currentTodo[key] = targetElement.value;
      }
    });

    let selectedDate = formData.get("dueDate");
    if (selectedDate) {
      this.currentTodo.dueDate = parseISO(selectedDate.toString());
    }

    if (this.isNewTodo) {
      this.refPubSub.publish(app.enumEventMessages.SET_CURRENT_TODO, null);
      this.refPubSub.publish(app.enumEventMessages.ADD_TODO, this.currentTodo);
    } else {
      this.refPubSub.publish(app.enumEventMessages.SET_CURRENT_TODO, null);
      this.refPubSub.publish(
        app.enumEventMessages.UPDATE_TODO,
        this.currentTodo
      );
    }
    this.refPubSub.publish(app.enumEventMessages.CHANGE_VIEW_LIST, null);
  }

  private loadTodo(data: app.ProjectList) {
    const loadedProject = data.getCurrentProject();
    if (loadedProject) {
      this.currentProject = loadedProject;
    }
    const targetTodoId = this.currentProject.getCurrentTodoId();
    const todoData = this.currentProject.getTodoItem(targetTodoId)?.getData();

    //Clear current todo after loading it

    if (todoData) {
      this.currentTodo = todoData;
      this.isNewTodo = false;

      //kludgey, need a better mechanism, maybe promises?
      setTimeout(() => {
        const todoForm = <HTMLFormElement>(
          this.targetContainer.querySelector("#todo-form")
        );
        if (todoForm) {
          Object.keys(this.currentTodo).forEach((key) => {
            let targetElement = <HTMLFormElement>(
              todoForm.querySelector(`#${key}`)
            );
            if (key !== "id" && key != "dueDate") {
              targetElement.value = this.currentTodo[key];
            }
            if (key == "dueDate") {
              targetElement.value = format(this.currentTodo[key], "yyyy-MM-dd");
            }
          });
        }
      }, 50);
    }
  }

  private addFlatPickr() {
    setTimeout(() => {
      const datePicker = flatpickr("#dueDate", { position: "above" });
    }, 50);
  }

  private generateOptionsFromEnum(targetEnum: any) {
    let valueList = Object.keys(targetEnum).filter(
      (key) => !isNaN(Number(targetEnum[key]))
    );

    let prioritySelectHTML: string = "";
    for (let valueItem in valueList) {
      prioritySelectHTML += `<option value="${valueItem}">${targetEnum[valueItem]}</option>`;
    }

    return prioritySelectHTML;
  }

  protected _updateOutputElement() {
    this.outputElement.className = styles["edit-task"];
    this.outputElement.innerHTML = `
    <div class=${styles["edit-task-content"]}>
    <form id="todo-form" name="todo-form">
      <label for="title">Title</label>
      <input type="text" name="title" id="title" maxlength="80" />
      <label for="Description">Description</label>
      <textarea id="description" name="description" rows="5" maxlength="500"></textarea>
      <label for="Status">Status</label>
      <select name="status" id="status">
      ${this.generateOptionsFromEnum(app.enumStatus)}
      </select>
      <label for="Priority">Priority</label>
      <select name="priority" id="priority">
      ${this.generateOptionsFromEnum(app.enumPriorities)}
      </select>
      <label for="due-date">Due Date</label>
      <input disable=true type="text" name="dueDate" id="dueDate" />
      <div class=${styles["button-box"]}>
      <button type="button" id="save-button">Save</button>
      <button type="button" id="cancel-button">Cancel</button>
      </div>
    </form>
    </div>
    `;

    this.addFlatPickr();
  }
}

export { TodoEdit };
