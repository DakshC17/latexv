import os
import re
import subprocess
import tempfile
import shutil
import time
import signal
import psutil
from typing import Optional, Tuple, List
from pathlib import Path


class LatexCompilationError(Exception):
    pass


class LatexTimeoutError(Exception):
    pass


class LatexResourceError(Exception):
    pass


# Comprehensive package mapping for multiple distributions
LATEX_PACKAGE_MAP = {
    # Common packages
    "xurl.sty": {
        "fedora": "texlive-xurl",
        "debian": "texlive-latex-extra",
        "ubuntu": "texlive-latex-extra",
        "arch": "texlive-latexextra",
        "centos": "texlive-xurl",
    },
    "babel.sty": {
        "fedora": "texlive-babel",
        "debian": "texlive-latex-base",
        "ubuntu": "texlive-latex-base",
        "arch": "texlive-core",
        "centos": "texlive-babel",
    },
    "geometry.sty": {
        "fedora": "texlive-geometry",
        "debian": "texlive-latex-extra",
        "ubuntu": "texlive-latex-extra",
        "arch": "texlive-latexextra",
        "centos": "texlive-geometry",
    },
    "amsmath.sty": {
        "fedora": "texlive-amsmath",
        "debian": "texlive-latex-base",
        "ubuntu": "texlive-latex-base",
        "arch": "texlive-core",
        "centos": "texlive-amsmath",
    },
    "graphicx.sty": {
        "fedora": "texlive-graphics",
        "debian": "texlive-latex-base",
        "ubuntu": "texlive-latex-base",
        "arch": "texlive-core",
        "centos": "texlive-graphics",
    },
    "tikz.sty": {
        "fedora": "texlive-pgf",
        "debian": "texlive-pictures",
        "ubuntu": "texlive-pictures",
        "arch": "texlive-pictures",
        "centos": "texlive-pgf",
    },
    "hyperref.sty": {
        "fedora": "texlive-hyperref",
        "debian": "texlive-latex-extra",
        "ubuntu": "texlive-latex-extra",
        "arch": "texlive-latexextra",
        "centos": "texlive-hyperref",
    },
    "listings.sty": {
        "fedora": "texlive-listings",
        "debian": "texlive-latex-extra",
        "ubuntu": "texlive-latex-extra",
        "arch": "texlive-latexextra",
        "centos": "texlive-listings",
    },
    "booktabs.sty": {
        "fedora": "texlive-booktabs",
        "debian": "texlive-latex-extra",
        "ubuntu": "texlive-latex-extra",
        "arch": "texlive-latexextra",
        "centos": "texlive-booktabs",
    },
    "caption.sty": {
        "fedora": "texlive-caption",
        "debian": "texlive-latex-extra",
        "ubuntu": "texlive-latex-extra",
        "arch": "texlive-latexextra",
        "centos": "texlive-caption",
    },
}

MISSING_STY_RE = re.compile(r"File `([^`]+\.sty)' not found\.")
MISSING_CLS_RE = re.compile(r"File `([^`]+\.cls)' not found\.")

# LaTeX engines in order of preference for fallback
LATEX_ENGINES = ["pdflatex", "xelatex", "lualatex"]

# Configuration constants
MAX_COMPILATION_TIME = 120  # 2 minutes timeout
MAX_MEMORY_MB = 2048  # 2GB memory limit
MAX_LATEX_SIZE = 500_000  # 500KB max input size
PROCESS_CHECK_INTERVAL = 1  # Check process every second


def _detect_distro() -> str:
    """Detect the current Linux distribution."""
    try:
        if os.path.exists("/etc/fedora-release"):
            return "fedora"
        elif os.path.exists("/etc/debian_version"):
            with open("/etc/debian_version") as f:
                if "ubuntu" in f.read().lower():
                    return "ubuntu"
            return "debian"
        elif os.path.exists("/etc/arch-release"):
            return "arch"
        elif os.path.exists("/etc/centos-release"):
            return "centos"
    except:
        pass
    return "unknown"


def _missing_package_hint(details: str) -> Optional[str]:
    """Generate comprehensive package installation hints."""
    distro = _detect_distro()

    # Check for .sty files
    sty_match = MISSING_STY_RE.search(details)
    if sty_match:
        sty_name = sty_match.group(1)
        if sty_name in LATEX_PACKAGE_MAP:
            pkg_info = LATEX_PACKAGE_MAP[sty_name]
            if distro in pkg_info:
                return (
                    f"Missing LaTeX package `{sty_name}`. "
                    f"Install: `{pkg_info[distro]}` on {distro.title()}"
                )
            else:
                return (
                    f"Missing LaTeX package `{sty_name}`. "
                    f"Install the corresponding texlive package for your distribution."
                )
        else:
            return (
                f"Missing LaTeX package `{sty_name}`. "
                f"Try: `tlmgr install {sty_name.replace('.sty', '')}` or install via your package manager."
            )

    # Check for .cls files
    cls_match = MISSING_CLS_RE.search(details)
    if cls_match:
        cls_name = cls_match.group(1)
        return (
            f"Missing document class `{cls_name}`. "
            f"Try: `tlmgr install {cls_name.replace('.cls', '')}` or search your package manager."
        )

    return None


def _kill_process_tree(pid: int) -> None:
    """Kill a process and all its children."""
    try:
        parent = psutil.Process(pid)
        children = parent.children(recursive=True)

        # Kill children first
        for child in children:
            try:
                child.kill()
            except psutil.NoSuchProcess:
                pass

        # Kill parent
        try:
            parent.kill()
        except psutil.NoSuchProcess:
            pass

        # Wait for processes to terminate
        gone, still_alive = psutil.wait_procs(children + [parent], timeout=3)

        # Force kill if still alive
        for process in still_alive:
            try:
                process.kill()
            except psutil.NoSuchProcess:
                pass
    except psutil.NoSuchProcess:
        pass


def _run_latex_engine(
    engine: str, source: str, temp_dir: str
) -> Tuple[subprocess.CompletedProcess, float]:
    """Run a specific LaTeX engine with robust monitoring."""
    tex_path = os.path.join(temp_dir, "document.tex")

    with open(tex_path, "w", encoding="utf-8") as f:
        f.write(source)

    start_time = time.time()

    # Start process with timeout
    try:
        process = subprocess.Popen(
            [engine, "-interaction=nonstopmode", "-halt-on-error", "document.tex"],
            cwd=temp_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid,  # Create new process group for easier cleanup
        )

        # Monitor process with timeout and memory checks
        while process.poll() is None:
            elapsed = time.time() - start_time

            # Check timeout
            if elapsed > MAX_COMPILATION_TIME:
                _kill_process_tree(process.pid)
                raise LatexTimeoutError(
                    f"LaTeX compilation timed out after {MAX_COMPILATION_TIME}s using {engine}"
                )

            # Check memory usage
            try:
                ps_process = psutil.Process(process.pid)
                memory_mb = ps_process.memory_info().rss / 1024 / 1024
                if memory_mb > MAX_MEMORY_MB:
                    _kill_process_tree(process.pid)
                    raise LatexResourceError(
                        f"LaTeX compilation exceeded memory limit ({memory_mb:.1f}MB > {MAX_MEMORY_MB}MB)"
                    )
            except psutil.NoSuchProcess:
                # Process already terminated
                break

            time.sleep(PROCESS_CHECK_INTERVAL)

        # Get final process result
        stdout, stderr = process.communicate()
        completed_process = subprocess.CompletedProcess(
            process.args, process.returncode, stdout, stderr
        )

        compilation_time = time.time() - start_time
        return completed_process, compilation_time

    except FileNotFoundError:
        raise LatexCompilationError(
            f"LaTeX engine '{engine}' not found. Please install TeX Live."
        )
    except Exception as e:
        if process:
            _kill_process_tree(process.pid)
        raise


def _apply_latex_fixes(latex_code: str, error_details: str) -> str:
    """Apply intelligent fixes based on error patterns."""
    fixed_code = latex_code

    # Fix 1: Remove problematic T1 fontenc for font issues
    if "ecrm1000.tfm" in error_details or "mktextfm" in error_details:
        fixed_code = re.sub(
            r"\\usepackage\s*\[\s*T1\s*\]\s*\{\s*fontenc\s*\}", "", fixed_code
        )

    # Fix 2: Replace problematic characters
    if "Package inputenc Error" in error_details:
        # Replace common problematic characters
        char_replacements = {
            """: "``",
            """: "''",
            "'": "'",
            "'": "`",
            "–": "--",
            "—": "---",
            "…": "\\ldots",
        }
        for old_char, new_char in char_replacements.items():
            fixed_code = fixed_code.replace(old_char, new_char)

    # Fix 3: Add missing packages if detected
    missing_packages = []
    if "tikz" in error_details.lower() and "\\usepackage{tikz}" not in fixed_code:
        missing_packages.append("\\usepackage{tikz}")
    if "amsmath" in error_details.lower() and "\\usepackage{amsmath}" not in fixed_code:
        missing_packages.append("\\usepackage{amsmath}")
    if (
        "graphicx" in error_details.lower()
        and "\\usepackage{graphicx}" not in fixed_code
    ):
        missing_packages.append("\\usepackage{graphicx}")

    if missing_packages:
        # Find documentclass line and add packages after it
        doc_class_match = re.search(r"(\\documentclass.*?})", fixed_code)
        if doc_class_match:
            insertion_point = doc_class_match.end()
            packages_str = "\n" + "\n".join(missing_packages) + "\n"
            fixed_code = (
                fixed_code[:insertion_point]
                + packages_str
                + fixed_code[insertion_point:]
            )

    return fixed_code


def compile_latex(latex_code: str, max_engines: int = None) -> str:
    """
    Compile LaTeX code with comprehensive robustness features.

    Args:
        latex_code: The LaTeX source code
        max_engines: Maximum number of engines to try (None = all)

    Returns:
        Path to compiled PDF

    Raises:
        LatexCompilationError: If compilation fails
        LatexTimeoutError: If compilation times out
        LatexResourceError: If resource limits exceeded
    """
    # Input validation
    if not latex_code or not latex_code.strip():
        raise LatexCompilationError("Empty LaTeX code provided")

    if len(latex_code) > MAX_LATEX_SIZE:
        raise LatexCompilationError(
            f"LaTeX code too large ({len(latex_code)} bytes > {MAX_LATEX_SIZE} bytes)"
        )

    temp_dir = None
    all_errors = []
    engines_to_try = LATEX_ENGINES[:max_engines] if max_engines else LATEX_ENGINES

    try:
        temp_dir = tempfile.mkdtemp(prefix="latex_compile_")

        for engine_idx, engine in enumerate(engines_to_try):
            current_code = latex_code
            engine_errors = []

            # Try compilation with current engine and progressive fixes
            for attempt in range(3):  # 3 attempts per engine
                try:
                    process, compilation_time = _run_latex_engine(
                        engine, current_code, temp_dir
                    )
                    pdf_path = os.path.join(temp_dir, "document.pdf")

                    if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
                        print(
                            f"[SUCCESS] Compilation successful with {engine} in {compilation_time:.2f}s (attempt {attempt + 1})"
                        )

                        # Copy PDF to a permanent location before temp cleanup
                        permanent_pdf = tempfile.NamedTemporaryFile(
                            suffix=".pdf", delete=False, prefix="latex_output_"
                        )
                        permanent_pdf.close()  # Close handle but keep file

                        shutil.copy2(pdf_path, permanent_pdf.name)
                        print(
                            f"[INFO] PDF saved to permanent location: {permanent_pdf.name}"
                        )

                        return permanent_pdf.name

                    # Compilation "succeeded" but no PDF - treat as error
                    stdout = (
                        process.stdout.decode(errors="ignore") if process.stdout else ""
                    )
                    stderr = (
                        process.stderr.decode(errors="ignore") if process.stderr else ""
                    )
                    error_details = (stderr or stdout).strip() or "No PDF generated"

                    print(f"[WARN] {engine} attempt {attempt + 1} failed: No PDF generated")
                    engine_errors.append(f"Attempt {attempt + 1}: {error_details}")

                    # Apply fixes for next attempt
                    if attempt < 2:  # Don't fix on last attempt
                        current_code = _apply_latex_fixes(current_code, error_details)

                except (LatexTimeoutError, LatexResourceError) as e:
                    print(f"[ERROR] {engine} attempt {attempt + 1} failed: {e}")
                    engine_errors.append(f"Attempt {attempt + 1}: {e}")
                    break  # Don't retry on timeout/resource errors

                except Exception as e:
                    print(f"[ERROR] {engine} attempt {attempt + 1} failed: {e}")
                    engine_errors.append(f"Attempt {attempt + 1}: {e}")

                    # Apply fixes for next attempt
                    if attempt < 2:
                        current_code = _apply_latex_fixes(current_code, str(e))

            all_errors.extend([f"{engine}: {error}" for error in engine_errors])

        # All engines failed
        final_error = "\n".join(all_errors)

        # Add helpful hints
        package_hint = _missing_package_hint(final_error)
        if package_hint:
            final_error += f"\n\nHint: {package_hint}"

        if "ecrm1000.tfm" in final_error or "mktextfm" in final_error:
            final_error += (
                "\n\nHint: Missing TeX EC fonts. Install package `texlive-ec` "
                "(Fedora) or `texlive-fonts-recommended` (Debian/Ubuntu)."
            )

        if "mf: command not found" in final_error:
            final_error += (
                "\n\nHint: MetaFont is missing. Install `texlive-metafont` on Fedora "
                "(and keep `texlive-ec` installed for EC fonts)."
            )

        raise LatexCompilationError(final_error)

    finally:
        # Cleanup temporary directory
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Warning: Could not clean up temp directory {temp_dir}: {e}")


# Legacy function for backward compatibility
def compile_latex_legacy(latex_code: str) -> str:
    """Legacy compilation function - single engine, no robustness features."""

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

    sty_hint = _missing_package_hint(details)
    if sty_hint:
        details += f"\nHint: {sty_hint}"

    raise LatexCompilationError(details)
