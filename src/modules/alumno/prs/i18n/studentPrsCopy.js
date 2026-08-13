export const studentPrsCopy = {
  es: {
    loading: "Cargando PRs...", title: "Personal Records", subtitle: "Registra, mejora y supera tus marcas personales.", athlete: "Atleta",
    registerNew: "Registrar nuevo PR", registered: "PR registrados", latestPr: "Último PR", bestPr: "Mejor PR general", strongestExercise: "Ejercicio más fuerte",
    history: "Historial de PR", bestMarks: "Mejores marcas", evolution: "Evolución", tips: "Tips PHO3NIX", noRecords: "Todavía no tienes registros de PR.",
    exercise: "Ejercicio", selectExercise: "Selecciona un ejercicio", weightLb: "Peso en libras", date: "Fecha", save: "Guardar PR", saving: "Guardando...", cancel: "Cancelar",
    edit: "Editar", delete: "Eliminar", duplicated: "Ya tienes un PR registrado para este ejercicio en esa fecha.", validWeight: "Ingresa un peso válido en libras.", confirmDelete: "¿Eliminar este PR?",
    successSave: "PR registrado correctamente.", successUpdate: "PR actualizado correctamente.", successDelete: "PR eliminado correctamente.", error: "No se pudo cargar la sección de PRs."
  },
  en: {
    loading: "Loading PRs...", title: "Personal Records", subtitle: "Log, improve, and beat your personal marks.", athlete: "Athlete",
    registerNew: "Register new PR", registered: "Registered PRs", latestPr: "Latest PR", bestPr: "Best overall PR", strongestExercise: "Strongest exercise",
    history: "PR history", bestMarks: "Best marks", evolution: "Evolution", tips: "PHO3NIX Tips", noRecords: "You do not have PR records yet.",
    exercise: "Exercise", selectExercise: "Select an exercise", weightLb: "Weight in pounds", date: "Date", save: "Save PR", saving: "Saving...", cancel: "Cancel",
    edit: "Edit", delete: "Delete", duplicated: "You already have a PR for this exercise on that date.", validWeight: "Enter a valid weight in pounds.", confirmDelete: "Delete this PR?",
    successSave: "PR saved successfully.", successUpdate: "PR updated successfully.", successDelete: "PR deleted successfully.", error: "Could not load PR section."
  }
}
export function getStudentPrsCopy(locale = "es") { return studentPrsCopy[locale] || studentPrsCopy.es }
