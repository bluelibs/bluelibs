export enum {{ className }} {
  {{# each elements }}
    {{# if description }}
      /**
       * {{ description }}
       */
    {{/ if }}
    {{ id }} = "{{ value }}",
  {{/ each }}
}

export enum {{ className }}Labels {
  {{# each elements }}
    "{{ id }}" = "{{ label }}",
  {{/ each }}
}
