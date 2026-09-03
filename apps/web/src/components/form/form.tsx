import { createFormHook } from "@tanstack/react-form";

import { PasswordField, SubmitButton, TextField } from "./fields";
import { fieldContext, formContext } from "./form-context";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    PasswordField,
    TextField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
