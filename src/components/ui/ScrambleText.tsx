import { useScramble } from '../../hooks/useScramble'

interface ScrambleTextProps {
  text: string
  className?: string
}

/** Text that decodes itself on hover. */
export default function ScrambleText({ text, className = '' }: ScrambleTextProps) {
  const [output, scramble] = useScramble(text)
  return (
    <span className={className} onMouseEnter={() => scramble()} aria-label={text}>
      <span aria-hidden="true">{output}</span>
    </span>
  )
}
