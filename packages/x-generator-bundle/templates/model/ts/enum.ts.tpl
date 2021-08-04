export enum {{ className }} {
  {{# each elements }}
    {{ field }} = "{{ value }}",
  {{/ each }}
}

export enum {{ className }}Labels {
  {{# each elements }}
    "{{ value }}" = "{{ label }}",
  {{/ each }}
}
