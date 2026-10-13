import React from 'react';
export function Button({primary=false,children,onClick,type='button',...props}){
 return <button onClick={onClick} type={type} className={`ui-button ${primary?'ui-button-primary':''}`} {...props}>{children}</button>;
}
