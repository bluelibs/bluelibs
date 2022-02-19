import * as React from "react";

export interface IRequestMagicLinkProps {
  name: string;
  magicLink: string;
  username: string;
  code: string;
  regardsName: string;
}

export function RequestMagicLink(props: IRequestMagicLinkProps) {
  return (
    <div>
      <p>Hello {props.name},</p>
      <p>
        You asked for a authentication Link to your account, please click on the
        folowing<a href={props.magicLink}>url</a>{" "}
        {props.code ? <>or submit the auth code : {props.code}</> : <></>}
      </p>

      <p>
        Regards, <br />
        {props.regardsName}
      </p>
    </div>
  );
}
