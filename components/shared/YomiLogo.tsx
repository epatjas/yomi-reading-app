import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

const YomiLogo: React.FC<SvgProps> = (props) => {
  return (
    <Svg
      width={68}
      height={31}
      viewBox="0 0 68 31"
      fill="none"
      {...props}
    >
      <Path
        d="M4.328 30.156c-1.75 0-2.703-.656-2.703-1.844 0-.797.563-1.312 1.469-1.312.328 0 .484.016.843.016.875 0 1.782-.453 2.36-1.907l.281-.812L1.156 10.03c-.14-.39-.218-.797-.218-1.11 0-1.062.859-1.812 2-1.812.984 0 1.53.438 1.859 1.532l3.953 12.047h.063L12.766 8.625c.328-1.062.89-1.516 1.875-1.516 1.11 0 1.89.735 1.89 1.766 0 .313-.078.75-.218 1.125l-5.453 14.594c-1.5 4.125-3.219 5.562-6.532 5.562zm21.203-5.828c-4.86 0-8.015-3.234-8.015-8.61 0-5.343 3.187-8.624 8.015-8.624 4.828 0 8.016 3.265 8.016 8.625 0 5.375-3.156 8.61-8.016 8.61zm0-3.078c2.469 0 4.063-2 4.063-5.532 0-3.515-1.594-5.53-4.063-5.53-2.453 0-4.062 2.015-4.062 5.53 0 3.532 1.594 5.532 4.062 5.532zm12.453 3.062c-1.172 0-1.937-.75-1.937-2.047V9.094c0-1.266.765-1.985 1.859-1.985 1.094 0 1.875.719 1.875 1.985v1.218h.078c.719-1.921 2.469-3.187 4.719-3.187 2.344 0 4.016 1.203 4.625 3.328h.094c.797-2.047 2.766-3.328 5.156-3.328 3.266 0 5.406 2.203 5.406 5.515v9.625c0 1.297-.781 2.047-1.937 2.047-1.172 0-1.953-.75-1.953-2.047v-8.672c0-2.031-1.063-3.187-2.969-3.187-1.875 0-3.156 1.375-3.156 3.36v8.5c0 1.296-.735 2.046-1.891 2.046-1.172 0-1.89-.75-1.89-2.047v-8.875c0-1.844-1.126-2.984-2.938-2.984-1.875 0-3.188 1.453-3.188 3.453v8.406c0 1.297-.796 2.047-1.953 2.047zM65.016 5.11c-1.204 0-2.157-.938-2.157-2.11 0-1.187.953-2.109 2.157-2.109 1.218 0 2.171.922 2.171 2.11 0 1.171-.953 2.109-2.171 2.109zm0 19.203c-1.188 0-1.938-.781-1.938-2.047V9.156c0-1.25.75-2.047 1.938-2.047 1.187 0 1.953.797 1.953 2.063v13.094c0 1.266-.766 2.047-1.953 2.047z"
        fill="#EEEFFB"
      />
    </Svg>
  )
}

export default YomiLogo