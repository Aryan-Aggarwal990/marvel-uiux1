import { useScramble } from '../../hooks/useScramble'

/** Text that decodes itself on hover (and optionally on mount). */
export default function ScrambleText({ text, as: Tag = 'span', autoplay = false, className = '', ...rest }) {
  const [output, scramble] = useScramble(text, { autoplay })
  return (
    <Tag className={className} onMouseEnter={() => scramble()} aria-label={text} {...rest}>
      <span aria-hidden="true">{output}</span>
    </Tag>
  )
}
