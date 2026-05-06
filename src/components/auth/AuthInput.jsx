import FormField from '../FormField'
import FormInput from '../FormInput'

export default function AuthInput({ label, ...props }) {
  return (
    <FormField label={label}>
      <FormInput {...props} />
    </FormField>
  )
}
