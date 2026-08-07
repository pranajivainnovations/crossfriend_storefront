const ErrorMessage = ({
  error,
  "data-testid": dataTestid,
}: {
  error?: unknown
  "data-testid"?: string
}) => {
  // Deliberately not `if (!error) return null` on a typed string. Several callers pass the state of
  // a useFormState action whose success value is an object (e.g. { redirectTo }), and a browser
  // running a stale client bundle can hand the whole object here instead of its .error field.
  // Rendering an object as a React child throws and takes down the entire checkout page — a blank
  // screen at the worst possible moment — so anything that isn't a non-empty string is ignored.
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : null

  if (!message) {
    return null
  }

  return (
    <div
      className="pt-2 text-rose-500 text-small-regular"
      data-testid={dataTestid}
    >
      <span>{message}</span>
    </div>
  )
}

export default ErrorMessage
