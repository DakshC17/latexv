import os
import re
import subprocess
import tempfile


class LatexCompilationError(Exception):
    pass


MISSING_STY_RE = re.compile(r"File `([^`]+\.sty)' not found\.")


def _missing_sty_hint(details: str) -> str | None:
    match = MISSING_STY_RE.search(details)
    if not match:
        return None

    sty_name = match.group(1)
    fedora_map = {
        "xurl.sty": "texlive-xurl",
    }
    fedora_pkg = fedora_map.get(sty_name)

    if fedora_pkg:
        return (
            f"Missing LaTeX package `{sty_name}`. Install `{fedora_pkg}` on Fedora "
            "(or the matching TeX package on your distro)."
        )

    return (
        f"Missing LaTeX package `{sty_name}`. Install the TeX package that provides this file "
        "on your distro."
    )


def compile_latex(latex_code: str) -> str:
    def _run_pdflatex(source: str):
        temp_dir = tempfile.mkdtemp()
        tex_path = os.path.join(temp_dir, "document.tex")

        with open(tex_path, "w") as f:
            f.write(source)

        process = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "-halt-on-error", "document.tex"],
            cwd=temp_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        return temp_dir, process

    temp_dir, process = _run_pdflatex(latex_code)
    pdf_path = os.path.join(temp_dir, "document.pdf")

    if os.path.exists(pdf_path):
        return pdf_path

    stdout = process.stdout.decode(errors="ignore")
    stderr = process.stderr.decode(errors="ignore")
    details = (stderr or stdout).strip()
    if not details:
        details = "LaTeX compilation failed"

    if "ecrm1000.tfm" in details or "mktextfm" in details:
        fallback_code = re.sub(
            r"\\usepackage\s*\[\s*T1\s*\]\s*\{\s*fontenc\s*\}",
            "",
            latex_code,
        )
        if fallback_code != latex_code:
            retry_temp_dir, retry_process = _run_pdflatex(fallback_code)
            retry_pdf_path = os.path.join(retry_temp_dir, "document.pdf")
            if os.path.exists(retry_pdf_path):
                return retry_pdf_path
            retry_stdout = retry_process.stdout.decode(errors="ignore")
            retry_stderr = retry_process.stderr.decode(errors="ignore")
            details = (retry_stderr or retry_stdout).strip() or details

        if "ecrm1000.tfm" in details or "mktextfm" in details:
            details += (
                "\nHint: Missing TeX EC fonts. Install package `texlive-ec` "
                "(Fedora) or `texlive-fonts-recommended` (Debian/Ubuntu)."
            )

    if "mf: command not found" in details:
        details += (
            "\nHint: MetaFont is missing. Install `texlive-metafont` on Fedora "
            "(and keep `texlive-ec` installed for EC fonts)."
        )

    sty_hint = _missing_sty_hint(details)
    if sty_hint:
        details += f"\nHint: {sty_hint}"

    raise LatexCompilationError(details)